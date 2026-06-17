/* eslint-disable no-undef */
const mockSendMail = jest.fn();

const mockVerify = jest.fn(callback => callback(null, 'Success'));

const createTransport = jest.fn(() => ({
  sendMail: mockSendMail,
  verify: mockVerify,
}));

export default {
  createTransport,
};

export { mockSendMail, mockVerify };
