package com.vectorcamapp

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import org.pytorch.IValue
import org.pytorch.Module
import org.pytorch.torchvision.TensorImageUtils
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class MosquitoDetectorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    init {
        if (yoloModel == null) {
            val modelPath = assetFilePath(reactApplicationContext, "best.torchscript.ptl")
            if (modelPath != null) {
                yoloModel = Module.load(modelPath)
                Log.d("MosquitoDetectorModule", "Model loaded successfully from $modelPath")
            } else {
                Log.e("MosquitoDetectorModule", "Failed to load model file.")
            }
        }
    }

    private fun assetFilePath(context: Context, assetName: String): String? {
        val file = File(context.filesDir, assetName)
        try {
            if (!file.exists()) {
                Log.d("MosquitoDetectorModule", "File does not exist, creating new file: ${file.absolutePath}")
                context.assets.open(assetName).use { inputStream ->
                    FileOutputStream(file).use { outputStream ->
                        val buffer = ByteArray(4 * 1024)
                        var read: Int
                        while (inputStream.read(buffer).also { read = it } != -1) {
                            outputStream.write(buffer, 0, read)
                        }
                        outputStream.flush()
                    }
                }
                Log.d("MosquitoDetectorModule", "File copied successfully")
            } else {
                Log.d("MosquitoDetectorModule", "File already exists: ${file.absolutePath}")
            }
            return file.absolutePath
        } catch (e: IOException) {
            Log.e("MosquitoDetectorModule", "Error copying asset file", e)
        } catch (e: Exception) {
            Log.e("MosquitoDetectorModule", "Unexpected error", e)
        }
        return null
    }

    companion object {
        private var yoloModel: Module? = null
        private const val NUM_OUTPUT_FIELDS = 6

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

        fun getYoloCoordinates(fullImage: Bitmap): Map<String, Double>? {
            if (yoloModel == null) {
                return null
            }

            return try {
                val scaledImage = Bitmap.createScaledBitmap(fullImage, 640, 640, false)

                Log.d("MosquitoDetectorModule", "Starting YOLO Processing")
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
                Log.d("MosquitoDetectorModule", "YOLO Processing Complete")

                val numDetections = outputs.size / NUM_OUTPUT_FIELDS
                val detections = getDetections(outputs, numDetections, 0.7f, 0) // Example threshold and mosquito class index
                val maxConfidenceDetection = detections.maxByOrNull { it["confidence"] ?: 0.0 }
                maxConfidenceDetection?.also {
                    Log.d("Max Confidence Detection", "x: ${it["x"]}, y: ${it["y"]}, w: ${it["w"]}, h: ${it["h"]}, confidence: ${it["confidence"]}, classScore: ${it["classScore"]}")
                    return it
                }
                null
            } catch (error: Exception) {
                Log.e("MosquitoDetectorModule", "Error during model inference", error)
                null
            }
        }
    }

    override fun getName() = "MosquitoDetectorModule"
}
