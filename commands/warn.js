const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

const WARN_FILE = './warnings.json';

function loadWarnings() {
  if (!fs.existsSync(WARN_FILE)) return {};
  return JSON.parse(fs.readFileSync(WARN_FILE));
}

function saveWarnings(data) {
  fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('إعطاء تحذير لعضو')
    .addUserOption(option => option.setName('user').setDescription('المستخدم').setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('نوع التحذير')
        .setRequired(true)
        .addChoices(
          { name: 'تحذير اداري اول', value: 'تحذير اداري اول' },
          { name: 'تحذير اداري ثاني', value: 'تحذير اداري ثاني' },
          { name: 'كسر رتبه إدارييه', value: 'كسر رتبه إدارييه' }
        )
    ),
  async execute(interaction) {
    const member = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const roleId = config.warningRoleIds[type];
    const guild = interaction.guild;
    const target = await guild.members.fetch(member.id);
    
    if (!interaction.member.roles.cache.some(r => config.warnManagers.includes(r.id))) {
      return interaction.reply({ content: 'ليس لديك صلاحية استخدام هذا الأمر.', ephemeral: true });
    }

    const role = guild.roles.cache.get(roleId);
    if (!role) return interaction.reply({ content: 'لم يتم العثور على الرتبة.', ephemeral: true });

    await target.roles.add(role);

    const warnings = loadWarnings();
    warnings[member.id] = warnings[member.id] || [];
    warnings[member.id].push({ type, date: new Date().toISOString(), by: interaction.user.id });
    saveWarnings(warnings);

    const logChannel = guild.channels.cache.get(config.logChannelId);
    if (logChannel) {
      logChannel.send(`🚨 ${member.tag} حصل على: ${type} بواسطة ${interaction.user.tag}`);
    }

    await interaction.reply({ content: `${member.tag} تم إعطاؤه تحذير: ${type}` });
  }
};