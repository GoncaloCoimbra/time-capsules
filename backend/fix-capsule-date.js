require('dotenv').config();
const sequelize = require('./src/models/index');
const Capsule = require('./src/models/Capsule');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado à BD');
    
    const capsule = await Capsule.findByPk('9825b953-30b4-44a2-b031-e8155396244e');
    
    if (!capsule) {
      console.log('❌ Cápsula não encontrada');
      process.exit(1);
    }
    
    console.log(`\n📋 Cápsula antes da atualização:`);
    console.log(`   Título: ${capsule.title}`);
    console.log(`   Data antiga: ${capsule.unlockDate}`);
    console.log(`   Desbloqueada: ${capsule.isUnlocked}`);
    
    // Atualizar a data
    await capsule.update({
      unlockDate: new Date('2026-01-27T16:17:00Z')
    });
    
    console.log(`\n✅ Cápsula atualizada:`);
    console.log(`   Data nova: ${capsule.unlockDate}`);
    console.log(`   Desbloqueada: ${capsule.isUnlocked}`);
    console.log(`\n💡 Agora refresca a página no browser (F5) para ver a mudança`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
