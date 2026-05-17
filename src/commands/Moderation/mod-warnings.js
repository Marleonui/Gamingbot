import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getGuildConfig } from '../../services/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mod-warnings')
        .setDescription('Verwalte die Verwarnungen eines Nutzers')
        .addSubcommand(subcommand =>
            subcommand
                .setName('anzeigen')
                .setDescription('Zeige die Verwarnungen eines Nutzers')
                .addUserOption(option =>
                    option
                        .setName('nutzer')
                        .setDescription('Der Nutzer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hinzufügen')
                .setDescription('Verwarnung hinzufügen')
                .addUserOption(option =>
                    option
                        .setName('nutzer')
                        .setDescription('Der Nutzer')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('grund')
                        .setDescription('Grund der Verwarnung')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('entfernen')
                .setDescription('Verwarnung entfernen')
                .addUserOption(option =>
                    option
                        .setName('nutzer')
                        .setDescription('Der Nutzer')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: 'Moderation',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction);

            const subcommand = interaction.options.getSubcommand();
            const user = interaction.options.getUser('nutzer');
            const guildConfig = await getGuildConfig(client, interaction.guild.id);

            if (subcommand === 'anzeigen') {
                await showWarnings(interaction, user, guildConfig);
            } else if (subcommand === 'hinzufügen') {
                await addWarning(interaction, user, guildConfig, client);
            } else if (subcommand === 'entfernen') {
                await removeWarning(interaction, user, guildConfig, client);
            }
        } catch (error) {
            logger.error('Error in mod-warnings command:', error);
            const embed = errorEmbed('Ein Fehler ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};

async function showWarnings(interaction, user, guildConfig) {
    const modData = guildConfig.moderation?.[user.id] || {};
    const warnings = modData.warnings || [];

    if (warnings.length === 0) {
        const embed = createEmbed({ title: `⚠️ Verwarnungen: ${user.username}`, color: 0x51CF66 })
            .setDescription('Dieser Nutzer hat keine Verwarnungen.');
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    const warningText = warnings
        .map((w, i) => `**${i + 1}.** ${w.reason || 'Kein Grund'} - ${w.date || 'Unbekannt'}`)
        .join('\n');

    const embed = createEmbed({ 
        title: `⚠️ Verwarnungen: ${user.username}`,
        color: 0xFF6B6B
    }).setDescription(`**Insgesamt: ${warnings.length}**\n\n${warningText}`);

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}

async function addWarning(interaction, user, guildConfig, client) {
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const now = new Date().toLocaleString('de-DE');

    if (!guildConfig.moderation) guildConfig.moderation = {};
    if (!guildConfig.moderation[user.id]) guildConfig.moderation[user.id] = {};
    if (!guildConfig.moderation[user.id].warnings) guildConfig.moderation[user.id].warnings = [];

    guildConfig.moderation[user.id].warnings.push({ reason, date: now });

    const { setGuildConfig } = await import('../../services/guildConfig.js');
    await setGuildConfig(client, interaction.guild.id, guildConfig);

    const embed = successEmbed(
        `⚠️ **Verwarnung hinzugefügt** für ${user.username}\n\n**Grund:** ${reason}`,
        'Moderations-Aktion'
    );

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}

async function removeWarning(interaction, user, guildConfig, client) {
    const modData = guildConfig.moderation?.[user.id];
    const warnings = modData?.warnings || [];

    if (warnings.length === 0) {
        const embed = errorEmbed('Dieser Nutzer hat keine Verwarnungen zum Entfernen!');
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    warnings.pop();

    const { setGuildConfig } = await import('../../services/guildConfig.js');
    await setGuildConfig(client, interaction.guild.id, guildConfig);

    const embed = successEmbed(
        `✅ Die letzte Verwarnung von ${user.username} wurde entfernt.\n\n**Verbleibende Verwarnungen:** ${warnings.length}`,
        'Moderations-Aktion'
    );

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}
