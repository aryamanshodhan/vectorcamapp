package com.vectorcamapp

import android.util.Log
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

class MosquitoDetectorFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        val image = frame.image
        Log.d(
                "ExampleKotlinPlugin",
                image.width.toString() + " x " + image.height.toString() + " Image with format #" + image.format
        )
        return null
    }
}