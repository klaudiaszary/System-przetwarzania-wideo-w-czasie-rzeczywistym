plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "pl.edu.apem.filtryvideo"
    compileSdk = 35

    defaultConfig {
        applicationId = "pl.edu.apem.filtryvideo"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.camera:camera-core:1.4.1")
    implementation("androidx.camera:camera-lifecycle:1.4.1")
}
