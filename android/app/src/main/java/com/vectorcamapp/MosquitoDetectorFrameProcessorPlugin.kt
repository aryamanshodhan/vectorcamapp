package com.vectorcamapp

import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.media.Image
import android.util.Base64
import android.util.Log
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.io.ByteArrayOutputStream

class MosquitoDetectorFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        if (arguments != null) {
            Log.d("MosquitoDetectorPlugin", arguments.size.toString())
        }
        val image = frame.image
        val bitmap: Bitmap = convertToBitmap(image)
        val rotatedBitmap = rotateBitmap(bitmap, 90f)
        val detection = MosquitoDetectorModule.getYoloCoordinates(rotatedBitmap)
        if (detection != null) {
            Log.d("MosquitoDetectorPlugin", detection.keys.toString())
            Log.d("MosquitoDetectorPlugin", detection.values.toString())
        }

        // Convert bitmap to base64
        val outputStream = ByteArrayOutputStream()
        rotatedBitmap.compress(Bitmap.CompressFormat.JPEG, 100, outputStream)
        val byteArray = outputStream.toByteArray()
        val base64 = Base64.encodeToString(byteArray, Base64.DEFAULT)

        return detection
    }

    private fun convertToBitmap(image: Image): Bitmap {
        require(image.format == ImageFormat.YUV_420_888) { "Invalid image format" }

        val imageWidth = image.width
        val imageHeight = image.height
        val argbArray = IntArray(imageWidth * imageHeight)

        val yBuffer = image.planes[0].buffer
        val uBuffer = image.planes[1].buffer
        val vBuffer = image.planes[2].buffer

        val yRowStride = image.planes[0].rowStride
        val yPixelStride = image.planes[0].pixelStride
        val uvRowStride = image.planes[1].rowStride
        val uvPixelStride = image.planes[1].pixelStride

        for (y in 0 until imageHeight) {
            for (x in 0 until imageWidth) {
                val yIndex = (y * yRowStride) + (x * yPixelStride)
                val yValue = (yBuffer[yIndex].toInt() and 0xff) - 16

                val uvx = x / 2
                val uvy = y / 2

                val uvIndex00 = (uvy * uvRowStride) + (uvx * uvPixelStride)
                val uvIndex10 = uvIndex00 + uvPixelStride
                val uvIndex01 = uvIndex00 + uvRowStride
                val uvIndex11 = uvIndex01 + uvPixelStride

                val uValue = (if (uvIndex00 < uBuffer.limit()) (uBuffer[uvIndex00].toInt() and 0xff) else 0) * 0.25f +
                        (if (uvIndex10 < uBuffer.limit()) (uBuffer[uvIndex10].toInt() and 0xff) else 0) * 0.25f +
                        (if (uvIndex01 < uBuffer.limit()) (uBuffer[uvIndex01].toInt() and 0xff) else 0) * 0.25f +
                        (if (uvIndex11 < uBuffer.limit()) (uBuffer[uvIndex11].toInt() and 0xff) else 0) * 0.25f

                val vValue = (if (uvIndex00 < vBuffer.limit()) (vBuffer[uvIndex00].toInt() and 0xff) else 0) * 0.25f +
                        (if (uvIndex10 < vBuffer.limit()) (vBuffer[uvIndex10].toInt() and 0xff) else 0) * 0.25f +
                        (if (uvIndex01 < vBuffer.limit()) (vBuffer[uvIndex01].toInt() and 0xff) else 0) * 0.25f +
                        (if (uvIndex11 < vBuffer.limit()) (vBuffer[uvIndex11].toInt() and 0xff) else 0) * 0.25f

                val u = uValue - 128
                val v = vValue - 128

                var r = (1.164f * yValue + 1.596f * v).toInt()
                var g = (1.164f * yValue - 0.813f * v - 0.391f * u).toInt()
                var b = (1.164f * yValue + 2.018f * u).toInt()

                r = clamp(r, 0, 255)
                g = clamp(g, 0, 255)
                b = clamp(b, 0, 255)

                val argbIndex = y * imageWidth + x
                argbArray[argbIndex] = (255 shl 24) or (r shl 16) or (g shl 8) or b
            }
        }

        return Bitmap.createBitmap(argbArray, imageWidth, imageHeight, Bitmap.Config.ARGB_8888)
    }

    private fun clamp(value: Int, min: Int, max: Int): Int {
        return when {
            value < min -> min
            value > max -> max
            else -> value
        }
    }

    private fun rotateBitmap(source: Bitmap, angle: Float): Bitmap {
        val matrix = Matrix()
        matrix.postRotate(angle)
        return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
    }
}