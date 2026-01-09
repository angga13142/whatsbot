// File: src/services/notificationService.js

/**
 * Notification Service
 *
 * Purpose: Send alerts and reports via WhatsApp.
 * Uses lazy loading to avoid circular dependencies with Bot Client.
 *
 * @module services/notificationService
 */

let botClient = null;

class NotificationService {
  setClient(client) {
    botClient = client;
  }

  async sendToUser(phoneNumber, message) {
    if (!botClient) {
      console.warn('⚠️ Notification skipped: Bot client not initialized');
      return;
    }

    try {
      // Format number for whatsapp (e.g., 62812... @c.us)
      const formatted = phoneNumber.replace('+', '') + '@c.us';
      await botClient.sendMessage(formatted, message);
    } catch (error) {
      console.error(`Failed to send notification to ${phoneNumber}:`, error.message);
    }
  }

  async notifyTransactionApproved(transaction, userPhone) {
    await this.sendToUser(userPhone, `✅ Transaksi ${transaction.transaction_id} telah disetujui.`);
  }

  async notifyTransactionRejected(transaction, userPhone, reason) {
    await this.sendToUser(
      userPhone,
      `❌ Transaksi ${transaction.transaction_id} ditolak. Alasan: ${reason}`
    );
  }
}

module.exports = new NotificationService();
