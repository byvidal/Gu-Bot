function buildWelcomeMessage(user, ctx, userInfo) {
  const name = user.first_name || 'Usuario';
  const plan = userInfo.subscription || 'Free';
  const credits = userInfo.credits ?? 0;
  const status = userInfo.status || 'Activo';

  return `
━━━━━━━━━━━━━━━━━━━━
      𝗚𝗨 𝗖𝗛𝗞
━━━━━━━━━━━━━━━━━━━━

Bienvenido a 𝗚𝗨 𝗖𝗛𝗞

⤷ Nombre » ${name}
⤷ Chat ID » ${ctx.chat.id}
⤷ Plan » ${plan}
⤷ Créditos » ${credits}
⤷ Estado » ${status}

Selecciona una opción para continuar.
`;
}

module.exports = { buildWelcomeMessage };
