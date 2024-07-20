package com.vectorcamapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import android.media.Image
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.io.ByteArrayOutputStream
import java.io.IOException

class MosquitoDetectorFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        val image = frame.image
        val bitmap: Bitmap? = convertToBitmap(image)
        if (bitmap != null) {
            val rotatedBitmap = rotateBitmap(bitmap, 90f)
            val detection = MosquitoDetectorModule.getYoloCoordinates(rotatedBitmap)
            return detection
        }
        return null
    }

    private fun convertToBitmap(image: Image): Bitmap? {
        require(image.format == ImageFormat.YUV_420_888) { "Invalid image format" }

        val yuvImage = toYuvImage(image)
        val width = image.width
        val height = image.height

        // Convert to jpeg
        var jpegImage: ByteArray?
        try {
            ByteArrayOutputStream().use { out ->
                yuvImage.compressToJpeg(Rect(0, 0, width, height), 100, out)
                jpegImage = out.toByteArray()
            }
        } catch (e: IOException) {
            throw RuntimeException(e)
        }

        return BitmapFactory.decodeByteArray(jpegImage, 0, jpegImage!!.size)
    }

    private fun toYuvImage(image: Image): YuvImage {
        require(image.format == ImageFormat.YUV_420_888) { "Invalid image format" }

        val width = image.width
        val height = image.height

        // Order of U/V channel guaranteed, read more:
        // https://developer.android.com/reference/android/graphics/ImageFormat#YUV_420_888
        val yPlane = image.planes[0]
        val uPlane = image.planes[1]
        val vPlane = image.planes[2]

        val yBuffer = yPlane.buffer
        val uBuffer = uPlane.buffer
        val vBuffer = vPlane.buffer

        // Full size Y channel and quarter size U+V channels.
        val numPixels = (width * height * 1.5f).toInt()
        val nv21 = ByteArray(numPixels)
        var index = 0

        // Copy Y channel.
        val yRowStride = yPlane.rowStride
        val yPixelStride = yPlane.pixelStride
        for (y in 0 until height) {
            for (x in 0 until width) {
                nv21[index++] = yBuffer[y * yRowStride + x * yPixelStride]
            }
        }

        // Copy VU data; NV21 format is expected to have YYYYVU packaging.
        // The U/V planes are guaranteed to have the same row stride and pixel stride.
        val uvRowStride = uPlane.rowStride
        val uvPixelStride = uPlane.pixelStride
        val uvWidth = width / 2
        val uvHeight = height / 2

        for (y in 0 until uvHeight) {
            for (x in 0 until uvWidth) {
                val bufferIndex = (y * uvRowStride) + (x * uvPixelStride)
                // V channel.
                nv21[index++] = vBuffer[bufferIndex]
                // U channel.
                nv21[index++] = uBuffer[bufferIndex]
            }
        }
        return YuvImage(nv21, ImageFormat.NV21, width, height, null)
    }

    private fun rotateBitmap(source: Bitmap, angle: Float): Bitmap {
        val matrix = Matrix()
        matrix.postRotate(angle)
        return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
    }
}