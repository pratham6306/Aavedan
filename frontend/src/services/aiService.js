// frontend/src/services/aiService.js
import api from './api';

/**
 * Sends a chat message to the Aavedan Saathi AI orchestrator endpoint.
 *
 * @param {string} message - User query.
 * @param {string} sessionId - Conversation session UUID.
 * @returns {Promise<Object>} API Response data containing intent, reply/message, missing_fields, next_action, etc.
 */
export const sendChatMessage = async (message, sessionId, entities = null) => {
  const response = await api.post('/ai/chat/', {
    message,
    session_id: sessionId,
    ...(entities && { entities })
  });
  return response.data;
};

/**
 * Dispatches the compiled grievance email directly to the division office.
 *
 * @param {string} sessionId - Conversation session UUID.
 * @returns {Promise<Object>} API Response containing success status and success message.
 */
export const sendGrievanceEmail = async (sessionId) => {
  const response = await api.post('/ai/chat/send-email/', {
    session_id: sessionId
  });
  return response.data;
};

/**
 * Fetches the email preview containing sender/receiver emails, subject, and text body.
 *
 * @param {string} sessionId - Conversation session UUID.
 * @returns {Promise<Object>} API Response containing sender_email, receiver_email, subject, body_text.
 */
export const getEmailPreview = async (sessionId) => {
  const response = await api.post('/ai/chat/email-preview/', {
    session_id: sessionId
  });
  return response.data;
};

const aiService = {
  sendChatMessage,
  sendGrievanceEmail,
  getEmailPreview
};

export default aiService;
