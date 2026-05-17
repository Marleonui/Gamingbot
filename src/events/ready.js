import { Events, EmbedBuilder } from "discord.js";
import { logger, startupLog } from "../utils/logger.js";
import config from "../config/application.js";
import { reconcileReactionRoleMessages } from "../services/reactionRoleService.js";

const STATUS_CHANNEL_ID = '1505601898139353198';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    try {
      client.user.setPresence(config.bot.presence);

      startupLog(`Ready! Logged in as ${client.user.tag}`);
      startupLog(`Serving ${client.guilds.cache.size} guild(s)`);
      startupLog(`Loaded ${client.commands.size} commands`);

      const reconciliationSummary = await reconcileReactionRoleMessages(client);
      startupLog(
        `Reaction role reconciliation: scanned ${reconciliationSummary.scannedMessages}, removed ${reconciliationSummary.removedMessages}, errors ${reconciliationSummary.errors}`
      );

      // Sende Status-Nachricht in den Kanal
      await sendStatusMessage(client);
    } catch (error) {
      logger.error("Error in ready event:", error);
    }
  },
};

async function sendStatusMessage(client) {
  try {
    const channel = client.channels.cache.get(STATUS_CHANNEL_ID);
    
    if (!channel) {
      logger.warn(`Status channel not found: ${STATUS_CHANNEL_ID}`);
      return;
    }

    if (!channel.isTextBased()) {
      logger.warn(`Status channel is not text-based: ${STATUS_CHANNEL_ID}`);
      return;
    }

    // Kategorisiere Commands mit Emojis
    const categoryEmojis = {
      'Moderation': '🛡️',
      'Community': '👥',
      'Fun': '🎮',
      'Utility': '🔧',
      'Economy': '💰',
      'Leveling': '📈',
      'Verification': '✅',
      'Ticket': '🎫',
      'Voice': '🔊',
      'Logging': '📝',
      'Search': '🔍',
      'JoinToCreate': '🎤',
      'Birthday': '🎂',
      'ServerStats': '📊',
      'Giveaway': '🎁',
      'Welcome': '👋',
      'Reaction_roles': '🎯',
      'Tools': '🛠️'
    };

    // Gruppiere Commands nach Kategorie
    const commandsByCategory = {};
    client.commands.forEach(command => {
      const category = command.category || 'Sonstige';
      if (!commandsByCategory[category]) {
        commandsByCategory[category] = [];
      }
      commandsByCategory[category].push(command.data.name);
    });

    // Sortiere die wichtigen Kategorien nach oben
    const categoryOrder = ['Moderation', 'Community', 'Fun', 'Utility', 'Verification', 'Ticket', 'Voice', 'Leveling', 'Economy', 'Logging', 'Search', 'JoinToCreate', 'Birthday', 'ServerStats', 'Giveaway', 'Welcome', 'Reaction_roles', 'Tools'];
    const sortedCategories = Object.keys(commandsByCategory).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    // Erstelle Fields für jede Kategorie
    const fields = sortedCategories.map(category => {
      const commands = commandsByCategory[category];
      const emoji = categoryEmojis[category] || '📌';
      const commandList = commands
        .sort()
        .map(cmd => `\`/${cmd}\``)
        .join(', ');
      
      return {
        name: `${emoji} ${category} (${commands.length})`,
        value: commandList || 'Keine Commands',
        inline: false
      };
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 Mod & Test Mod Commands - Vollständige Übersicht')
      .setDescription('Alle verfügbaren Commands für Moderatoren')
      .addFields(...fields)
      .addFields(
        { name: '\u200B', value: '\u200B', inline: false },
        { name: '📊 Bot-Status', value: `Guilds: **${client.guilds.cache.size}** | Commands: **${client.commands.size}** | Online: <t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `Für Test Mods, Mods und Admins sichtbar | ${client.user.username}` });

    await channel.send({ embeds: [embed] });
    logger.info('Status message sent successfully');
  } catch (error) {
    logger.error('Error sending status message:', error);
  }
}


