// Admin Configuration
export const ADMIN_CONFIG = {
  registrationNumber: '12309972',
  name: 'Seelam Vamsi Siva Ganesh',
  pin: '2006'
};

export const isAdmin = (regNumber) => {
  return regNumber === ADMIN_CONFIG.registrationNumber;
};
