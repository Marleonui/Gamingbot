import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('count-blacklist')
        .setDescription('Verwalte die Blacklist des Counting-Spiels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Nutzer zur Blacklist hinzufügen')
                .addUserOption(option =>
                    option
                        .setName('nutzer')
                        .setDescription('Der Nutzer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Nutzer von der Blacklist entfernen')
                .addUserOption(option =>
                    option
                        .setName('nutzer')
                        .setDescription('Der Nutzer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Zeige alle blacklisteten Nutzer')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: 'Community',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction);

            const subcommand = interaction.options.getSubcommand();
            const guildConfig = await getGuildConfig(client, interaction.guild.id);

            if (!guildConfig.counting) {
                guildConfig.counting = {};
            }
            if (!guildConfig.counting.blacklist) {
                guildConfig.counting.blacklist = [];
            }

            if (subcommand === 'add') {
                await addToBlacklist(interaction, guildConfig, client);
            } else if (subcommand === 'remove') {
                await removeFromBlacklist(interaction, guildConfig, client);
            } else if (subcommand === 'list') {
                await showBlacklist(interaction, guildConfig, client);
            }
        } catch (error) {
            logger.error('Error in count-blacklist command:', error);
            const embed = errorEmbed('Ein Fehler ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};

async function addToBlacklist(interaction, guildConfig, client) {
    const user = interaction.options.getUser('nutzer');
    
    if (guildConfig.counting.blacklist.includes(user.id)) {
        const embed = errorEmbed(`${user.username} ist bereits auf der Blacklist!`);
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    guildConfig.counting.blacklist.push(user.id);
    await setGuildConfig(client, interaction.guild.id, guildConfig);

    const embed = successEmbed(
        `✅ ${user.username} wurde zur Blacklist hinzugefügt!`,
        'Counting Blacklist'
    );

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}

async function removeFromBlacklist(interaction, guildConfig, client) {
    const user = interaction.options.getUser('nutzer');
    const index = guildConfig.counting.blacklist.indexOf(user.id);

    if (index === -1) {
        const embed = errorEmbed(`${user.username} ist nicht auf der Blacklist!`);
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    guildConfig.counting.blacklist.splice(index, 1);
    await setGuildConfig(client, interaction.guild.id, guildConfig);

    const embed = successEmbed(
        `✅ ${user.username} wurde von der Blacklist entfernt!`,
        'Counting Blacklist'
    );

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}

async function showBlacklist(interaction, guildConfig, client) {
    const blacklist = guildConfig.counting.blacklist || [];

    if (blacklist.length === 0) {
        const embed = successEmbed('Die Blacklist ist leer!', 'Counting Blacklist');
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    const users = [];
    for (const userId of blacklist) {
        try {
            const user = await client.users.fetch(userId);
            users.push(`• ${user.username} (${user.id})`);
        } catch (err) {
            users.push(`• Unbekannter Nutzer (${userId})`);
        }
    }

    const embed = successEmbed(
        `**Blacklistete Nutzer (${blacklist.length}):**\n\n${users.join('\n')}`,
        'Counting Blacklist'
    );

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}
