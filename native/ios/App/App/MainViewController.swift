import UIKit
import Capacitor

/// Головний екран застосунку: той самий CAPBridgeViewController, плюс власні плагіни з цього проєкту.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(NativeAuthPlugin())
    }
}
