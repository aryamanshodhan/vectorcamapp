package com.vectorcamapp

import android.graphics.Bitmap
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import org.pytorch.IValue
import org.pytorch.Module
import org.pytorch.torchvision.TensorImageUtils

class MosquitoDetectorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    init {
        if (yoloModel == null) {
            val modelPath = PytorchModuleUtils.assetFilePath(reactApplicationContext, "best.torchscript.ptl")
            if (modelPath != null) {
                yoloModel = Module.load(modelPath)
                Log.d(TAG, "Model loaded successfully from $modelPath")
            } else {
                Log.e(TAG, "Failed to load model file.")
            }
        }
    }

    companion object {
        private var yoloModel: Module? = null
        private const val NUM_OUTPUT_FIELDS = 6
        private const val TAG = "MosquitoDetectorModule"

        fun getYoloCoordinates(fullImage: Bitmap): Map<String, Double>? {
            if (yoloModel == null) {
                return null
            }

            return try {
                val scaledImage = Bitmap.createScaledBitmap(fullImage, 640, 640, false)

                Log.d(TAG, "Starting YOLO Processing")
                val inputTensor = TensorImageUtils.bitmapToFloat32Tensor(
                        scaledImage,
                        floatArrayOf(0.0f, 0.0f, 0.0f),
                        floatArrayOf(1.0f, 1.0f, 1.0f)
                )

                val outputs: FloatArray
                if (yoloModel!!.forward(IValue.from(inputTensor)).isTensor) {
                    outputs = inputTensor.dataAsFloatArray
                } else {
                    val outputTuple: Array<IValue> = yoloModel!!.forward(IValue.from(inputTensor)).toTuple()
                    val outputTensor = outputTuple[0].toTensor()
                    outputs = outputTensor.dataAsFloatArray
                }
                Log.d(TAG, "YOLO Processing Complete")

                val numDetections = outputs.size / NUM_OUTPUT_FIELDS
                val detections = getDetections(outputs, numDetections, 0.7f, 0) // Example threshold and mosquito class index
                val maxConfidenceDetection = detections.maxByOrNull { it["confidence"] ?: 0.0 }
                maxConfidenceDetection?.also {
                    Log.d(TAG, "x: ${it["x"]}, y: ${it["y"]}, w: ${it["w"]}, h: ${it["h"]}, confidence: ${it["confidence"]}, classScore: ${it["classScore"]}")
                    return it
                }
                null
            } catch (error: Exception) {
                Log.e(TAG, "Error during model inference", error)
                null
            }
        }

        private fun getDetections(output: FloatArray, numDetections: Int, threshold: Float, mosquitoClassIndex: Int): List<Map<String, Double>> {
            val detections = mutableListOf<Map<String, Double>>()
            for (i in 0 until numDetections) {
                val offset = i * NUM_OUTPUT_FIELDS
                val x = output[offset].toDouble()
                val y = output[offset + 1].toDouble()
                val w = output[offset + 2].toDouble()
                val h = output[offset + 3].toDouble()
                val objectnessScore = output[offset + 4].toDouble()
                val classScore = output[offset + 5 + mosquitoClassIndex].toDouble()

                if (objectnessScore > threshold && classScore > threshold) {
                    val detection = mapOf(
                            "x" to x,
                            "y" to y,
                            "w" to w,
                            "h" to h,
                            "confidence" to objectnessScore,
                            "classScore" to classScore
                    )
                    detections.add(detection)
                }
            }
            return detections
        }
    }

    override fun getName() = "MosquitoDetectorModule"
}
