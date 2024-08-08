package com.vectorcamapp

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class PytorchModuleUtils {
    companion object {

        private const val TAG = "PytorchModuleUtils"

        fun assetFilePath(context: Context, assetName: String): String? {
            val file = File(context.filesDir, assetName)
            try {
                if (!file.exists()) {
                    Log.d(TAG, "File does not exist, creating new file: ${file.absolutePath}")
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
                    Log.d(TAG, "File copied successfully")
                } else {
                    Log.d(TAG, "File already exists: ${file.absolutePath}")
                }
                return file.absolutePath
            } catch (e: IOException) {
                Log.e(TAG, "Error copying asset file", e)
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error", e)
            }
            return null
        }
    }
}