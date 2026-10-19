// ====================================================================
// BIOMETRIC AUTHENTICATION SERVICE (SRS 4.1 & R6.2)
// Provides FaceID and Fingerprint biometric authentication for mobile.
// ====================================================================

class BiometricService {
  bool _mockSupported = true;

  Future<bool> isBiometricsAvailable() async {
    // In production with local_auth plugin:
    // final auth = LocalAuthentication();
    // return await auth.canCheckBiometrics || await auth.isDeviceSupported();
    return _mockSupported;
  }

  Future<bool> authenticateWithBiometrics({String reason = 'Authenticate to access AMG Holdings Enterprise Portal'}) async {
    // In production:
    // final auth = LocalAuthentication();
    // return await auth.authenticate(localizedReason: reason);
    await Future.delayed(const Duration(milliseconds: 300));
    return true;
  }
}
