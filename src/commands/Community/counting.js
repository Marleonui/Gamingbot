import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('counting-setup')
        .setDescription('Konfiguriert das Counting-Spiel für einen Kanal')
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Aktiviert das Counting-Spiel in einem Kanal')
                .addChannelOption(option =>
                    option
                        .setName('kanal')
                        .setDescription('Der Kanal für das Counting-Spiel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Deaktiviert das Counting-Spiel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Zeigt die Counting-Spiel Statistiken')
        ),
    category: 'Community',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction);

            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;

            if (subcommand === 'enable') {
                await enableCounting(interaction, client, guildId);
            } else if (subcommand === 'disable') {
                await disableCounting(interaction, client, guildId);
            } else if (subcommand === 'stats') {
                await showStats(interaction, client, guildId);
            }
        } catch (error) {
            logger.error('Error in counting setup command:', error);
            const embed = errorEmbed('Ein Fehler ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};

async function enableCounting(interaction, client, guildId) {
    try {
        const channel = interaction.options.getChannel('kanal');
        
        // Speichere die Counting-Kanal-Konfiguration
        const guildConfig = await getGuildConfig(client, guildId);
        if (!guildConfig.counting) {
            guildConfig.counting = {};
        }
        guildConfig.counting.enabled = true;
        guildConfig.counting.channelId = channel.id;
        guildConfig.counting.currentNumber = 0;
        guildConfig.counting.lastUserId = null;
        guildConfig.counting.record = 0;

        await setGuildConfig(client, guildId, guildConfig);

        const embed = successEmbed(
            `✅ Counting-Spiel aktiviert in ${channel}!\n\nDie Spieler können jetzt mit der Zahl 1 beginnen. Jeder muss der nächsten Zahl folgen. Bei einem Fehler startet das Spiel von vorne!`,
            'Counting-Spiel'
        );

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });

        // Sende eine Nachricht in den Kanal
        try {
            await channel.send({
                embeds: [successEmbed(
                    '🎮 **Counting-Spiel gestartet!**\n\nZählt abwechselnd die Zahlen! Jeder kann nur einmal hintereinander zählen. Wenn die Zahl falsch ist, fängt das Spiel von vorne an!',
                    'Let\'s count!'
                )]
            });
        } catch (err) {
            logger.error('Error sending start message to counting channel:', err);
        }
    } catch (error) {
        logger.error('Error enabling counting:', error);
        const embed = errorEmbed('Fehler beim Aktivieren des Counting-Spiels!');
        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }
}

async function disableCounting(interaction, client, guildId) {
    try {
        const guildConfig = await getGuildConfig(client, guildId);
        if (!guildConfig.counting) {
            const embed = errorEmbed('Das Counting-Spiel ist nicht aktiviert!');
            return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }

        guildConfig.counting.enabled = false;
        await setGuildConfig(client, guildId, guildConfig);

        const embed = successEmbed('❌ Counting-Spiel deaktiviert!', 'Counting-Spiel');
        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
        logger.error('Error disabling counting:', error);
        const embed = errorEmbed('Fehler beim Deaktivieren des Counting-Spiels!');
        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }
}

async function showStats(interaction, client, guildId) {
    try {
        const guildConfig = await getGuildConfig(client, guildId);
        
        if (!guildConfig.counting) {
            const embed = errorEmbed('Das Counting-Spiel ist nicht aktiviert!');
            return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }

        const currentNumber = guildConfig.counting.currentNumber || 0;
        const record = guildConfig.counting.record || 0;

        const embed = successEmbed(
            `**Aktuelle Zahl:** ${currentNumber}\n**Rekord:** ${record}`,
            '📊 Counting-Statistiken'
        );

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
        logger.error('Error showing counting stats:', error);
        const embed = errorEmbed('Fehler beim Abrufen der Statistiken!');
        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }
}
