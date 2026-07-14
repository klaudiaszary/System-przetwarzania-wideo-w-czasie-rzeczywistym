package pl.edu.apem.filtryvideo

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.SurfaceHolder
import android.view.SurfaceView

class FilterSurfaceView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : SurfaceView(context, attrs), SurfaceHolder.Callback {
    private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
    private var latestBitmap: Bitmap? = null

    init {
        holder.addCallback(this)
    }

    fun render(bitmap: Bitmap) {
        latestBitmap?.recycle()
        latestBitmap = bitmap
        drawFrame()
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        drawFrame()
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        drawFrame()
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        latestBitmap?.recycle()
        latestBitmap = null
    }

    private fun drawFrame() {
        val canvas = holder.lockCanvas() ?: return
        try {
            canvas.drawColor(Color.BLACK)
            latestBitmap?.let { bitmap ->
                drawCentered(canvas, bitmap)
            }
        } finally {
            holder.unlockCanvasAndPost(canvas)
        }
    }

    private fun drawCentered(canvas: Canvas, bitmap: Bitmap) {
        val scale = maxOf(
            canvas.width.toFloat() / bitmap.width.toFloat(),
            canvas.height.toFloat() / bitmap.height.toFloat(),
        )
        val scaledWidth = bitmap.width * scale
        val scaledHeight = bitmap.height * scale
        val left = (canvas.width - scaledWidth) / 2f
        val top = (canvas.height - scaledHeight) / 2f
        canvas.save()
        canvas.translate(left, top)
        canvas.scale(scale, scale)
        canvas.drawBitmap(bitmap, 0f, 0f, paint)
        canvas.restore()
    }
}
