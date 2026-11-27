import Foundation
import Capacitor
import AuthenticationServices
import CryptoKit

/// Вхід для js/cloud.js без сторонніх SDK:
/// • apple({ nonce })        — Sign in with Apple, повертає identity token (nonce хешується тут, як вимагає Apple)
///                              і authorization code (ним сервер відкликає вхід під час видалення акаунта)
/// • webAuth({ url, scheme }) — системне вікно входу (ASWebAuthenticationSession) для Google через Supabase,
///                              повертає адресу, на яку Supabase перенаправив після входу
@objc(NativeAuthPlugin)
public class NativeAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding, ASWebAuthenticationPresentationContextProviding {

    public let identifier = "NativeAuthPlugin"
    public let jsName = "NativeAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "apple", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "webAuth", returnType: CAPPluginReturnPromise)
    ]

    private var appleCall: CAPPluginCall?
    private var webSession: ASWebAuthenticationSession?

    // MARK: Sign in with Apple

    @objc func apple(_ call: CAPPluginCall) {
        guard let nonce = call.getString("nonce"), !nonce.isEmpty else {
            call.reject("nonce required")
            return
        }
        DispatchQueue.main.async {
            if let pending = self.appleCall { pending.reject("superseded", "CANCELED") }
            self.appleCall = call
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.email]
            request.nonce = SHA256.hash(data: Data(nonce.utf8)).map { String(format: "%02x", $0) }.joined()
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = appleCall else { return }
        appleCall = nil
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let data = credential.identityToken,
              let token = String(data: data, encoding: .utf8) else {
            call.reject("Apple did not return a token")
            return
        }
        let code = credential.authorizationCode.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        call.resolve(["idToken": token, "email": credential.email ?? "", "code": code])
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = appleCall else { return }
        appleCall = nil
        if (error as? ASAuthorizationError)?.code == .canceled {
            call.reject("canceled", "CANCELED")
        } else {
            call.reject(error.localizedDescription)
        }
    }

    // MARK: Вхід через браузер (Google)

    @objc func webAuth(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw),
              let scheme = call.getString("scheme"), !scheme.isEmpty else {
            call.reject("url and scheme required")
            return
        }
        DispatchQueue.main.async {
            self.webSession?.cancel()
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { [weak self] callback, error in
                self?.webSession = nil
                if let callback = callback {
                    call.resolve(["url": callback.absoluteString])
                } else if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin {
                    call.reject("canceled", "CANCELED")
                } else {
                    call.reject(error?.localizedDescription ?? "sign-in failed")
                }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false   // памʼятати вибраний акаунт Google
            self.webSession = session
            if !session.start() {
                self.webSession = nil
                call.reject("could not start sign-in")
            }
        }
    }

    // MARK: Вікно, над яким показувати вхід

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return anchor()
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return anchor()
    }

    private func anchor() -> ASPresentationAnchor {
        if let window = bridge?.webView?.window { return window }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let window = scenes.compactMap({ $0.keyWindow }).first { return window }
        return ASPresentationAnchor(windowScene: scenes.first!)
    }
}
