package pl.edu.apem.filtryvideo

import android.graphics.Bitmap
import android.graphics.Color
import androidx.camera.core.ImageProxy

object FrameFilter {
    fun process(image: ImageProxy, params: FilterParams): Bitmap {
        val width = image.width
        val height = image.height
        val luma = readLumaPlane(image)
        val adjusted = ByteArray(width * height)
        val contrastScale = params.contrast / 100f

        for (p in adjusted.indices) {
            val y = luma[p].toInt() and 0xff
            adjusted[p] = clampToByte((y - 128) * contrastScale + 128 + params.brightness)
        }

        val pixels = IntArray(width * height)
        for (y in 1 until height - 1) {
            val row = y * width
            for (x in 1 until width - 1) {
                val p = row + x
                val center = adjusted[p].toInt() and 0xff
                val gx = kotlin.math.abs((adjusted[p + 1].toInt() and 0xff) - (adjusted[p - 1].toInt() and 0xff))
                val gy = kotlin.math.abs((adjusted[p + width].toInt() and 0xff) - (adjusted[p - width].toInt() and 0xff))
                val edge = clampToInt(gx + gy)
                val thresholded = if (center >= params.threshold) 255 else 0
                val blended = clampToInt((1f - params.edgeMix) * thresholded + params.edgeMix * edge)
                pixels[p] = Color.rgb(blended, blended, blended)
            }
        }

        return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
    }

    private fun readLumaPlane(image: ImageProxy): ByteArray {
        val plane = image.planes[0]
        val buffer = plane.buffer
        val width = image.width
        val height = image.height
        val rowStride = plane.rowStride
        val pixelStride = plane.pixelStride
        val output = ByteArray(width * height)

        for (y in 0 until height) {
            val rowStart = y * rowStride
            for (x in 0 until width) {
                output[y * width + x] = buffer.get(rowStart + x * pixelStride)
            }
        }

        return output
    }

    private fun clampToByte(value: Float): Byte = clampToInt(value).toByte()

    private fun clampToInt(value: Float): Int = clampToInt(value.toInt())

    private fun clampToInt(value: Int): Int =
        when {
            value < 0 -> 0
            value > 255 -> 255
            else -> value
        }
}
