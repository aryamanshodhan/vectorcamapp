package com.vectorcamapp

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import org.pytorch.Module
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

        fun getYoloCoordinates(fullImage: Bitmap) {
            if (yoloModel == null) {
                return
            }
            Log.d("MosquitoDetectorModule", fullImage.height.toString() + " xxx " + fullImage.width.toString())
        }
    }

    override fun getName() = "MosquitoDetectorModule"

}