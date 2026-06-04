async function getUserInfo(userId) {
  // Aquí después conectas tu base de datos.
  return {
    subscription: 'Free',
    credits: 100,
    rank: 'Member',
    generated: 1500,
    status: 'Activo',
  };
}

module.exports = { getUserInfo };
