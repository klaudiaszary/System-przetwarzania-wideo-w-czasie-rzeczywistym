package pl.edu.apem.filtryvideo

data class FilterParams(
    val brightness: Int = 0,
    val contrast: Int = 100,
    val threshold: Int = 128,
    val edgeMix: Float = 0.25f,
)
