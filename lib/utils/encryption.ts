import CryptoJS from "crypto-js"

/**
 * Simple encryption/decryption utilities for API keys
 * Note: This is basic encryption for MVP. For production, use more secure methods.
 */

const SECRET_KEY = "genai-ui-secret-key" // In production, this should be environment-specific

/**
 * Encrypt a string
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString()
}

/**
 * Decrypt a string
 */
export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}







