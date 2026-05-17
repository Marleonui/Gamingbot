import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed, warningEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getGuildConfig } from '../../services/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mod-profil')
        .setDescription('Zeigt das Moderations-Profil eines Nutzers')
        .addUserOption(option =>
            option
                .setName('nutzer')
                .setDescription('Der Nutzer dessen Profil angezeigt werden soll')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    category: 'Moderation',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction);

            const user = interaction.options.getUser('nutzer');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                const embed = errorEmbed('Benutzer nicht gefunden!');
                return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
            }

            // Hole Moderations-Daten
            const guildConfig = await getGuildConfig(client, interaction.guild.id);
            const modData = guildConfig.moderation?.[user.id] || {};

            const warnings = modData.warnings || [];
            const cases = modData.cases || [];
            const bans = modData.bans || 0;
            const timeouts = modData.timeouts || 0;
            const kicks = modData.kicks || 0;

            const createdTimestamp = Math.floor(user.createdAt.getTime() / 1000);
            const joinedTimestamp = member.joinedAt ? Math.floor(member.joinedAt.getTime() / 1000) : null;

            const embed = createEmbed({ 
                title: `🛡️ Moderations-Profil: ${user.username}`,
                color: warnings.length > 0 ? 0xFF6B6B : 0x51CF66
            })
                .setThumbnail(user.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: '👤 Benutzer-ID', value: user.id, inline: true },
                    { name: '📅 Account erstellt', value: `<t:${createdTimestamp}:R>`, inline: true },
                    { name: '📍 Server beigetreten', value: joinedTimestamp ? `<t:${joinedTimestamp}:R>` : 'Nicht auf Server', inline: true },
                    { name: '\u200B', value: '\u200B', inline: false },
                    { name: '⚠️ Verwarnungen', value: `${warnings.length}`, inline: true },
                    { name: '🔇 Timeouts', value: `${timeouts}`, inline: true },
                    { name: '👢 Kicks', value: `${kicks}`, inline: true },
                    { name: '🚫 Bans', value: `${bans}`, inline: true },
                    { name: '📋 Cases', value: `${cases.length}`, inline: true },
                )

            if (warnings.length > 0) {
                const warningText = warnings
                    .slice(-5)
                    .map((w, i) => `**${i + 1}.** ${w.reason || 'Kein Grund angegeben'} (${w.date || 'Unbekannt'})`)
                    .join('\n');
                embed.addField('📋 Letzte Verwarnungen', warningText, false);
            }

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        } catch (error) {
            logger.error('Error in mod-profil command:', error);
            const embed = errorEmbed('Ein Fehler ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};
