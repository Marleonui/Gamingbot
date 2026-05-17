import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('team-commands')
        .setDescription('Zeige alle verfügbaren Team/Moderator Commands'),
    category: 'Utility',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction);

            const commands = [
                { name: '/mod-timeout', description: 'Nutzer zeitweise stummschalten' },
                { name: '/mod-ban', description: 'Nutzer vom Server bannen' },
                { name: '/mod-profil', description: 'Moderations-Profil anzeigen' },
                { name: '/mod-warnings', description: 'Verwarnungen verwalten' },
                { name: '/mod-kick', description: 'Nutzer vom Server kicken' },
                { name: '/mod-warn', description: 'Nutzer verwarnen' },
                { name: '/count-blacklist', description: 'Nutzer von Counting ausschließen' },
                { name: '/count-stats', description: 'Counting Statistiken' },
                { name: '/team-list', description: 'Team-Mitglieder anzeigen' },
                { name: '/counting-setup', description: 'Counting-Spiel konfigurieren' },
            ];

            const embed = createEmbed({ 
                title: '🛡️ Team/Moderator Commands',
                color: 0xFF6B6B
            })
                .setDescription('Alle verfügbaren Moderations-Commands:\n')
                .addFields(
                    ...commands.map(cmd => ({
                        name: cmd.name,
                        value: cmd.description,
                        inline: false
                    }))
                );

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        } catch (error) {
            logger.error('Error in team-commands command:', error);
            const embed = errorEmbed('Ein Fehler ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};
