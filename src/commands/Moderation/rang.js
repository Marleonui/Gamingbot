import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    UserSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    ChannelType
} from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, infoEmbed, warningEmbed } from '../../utils/embeds.js';
import { logEvent, generateCaseId, storeModerationCase } from '../../utils/moderation.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';

// Owner configuration
const OWNER_USER_IDS = new Set(['1336263337117356055', '1371441403804254361']);
const OWNER_ROLE_ID = '1505921070585348156';

// High permission roles that only owners can assign
const HIGH_PERMISSION_ROLES = new Set([
    OWNER_ROLE_ID,
    // Add other high-permission role IDs here if needed
]);

export default {
    data: new SlashCommandBuilder()
        .setName("rang")
        .setDescription("Manage user roles (Owner only)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    category: "moderation",

    async execute(interaction) {
        try {
            // Verify owner status
            const isOwner = await verifyOwnerStatus(interaction);
            if (!isOwner) {
                return await InteractionHelper.universalReply(interaction, {
                    embeds: [
                        errorEmbed(
                            'Du hast keine Berechtigung diesen Command zu nutzen.',
                            null,
                            { showDetails: false }
                        )
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Defer the interaction
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) {
                logger.warn(`Rang command defer failed`, {
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    commandName: 'rang'
                });
                return;
            }

            // Send initial selection menu
            await sendUserSelectionMenu(interaction);

        } catch (error) {
            logger.error('Rang command error:', error);
            await handleInteractionError(interaction, error, { subtype: 'rang_failed' });
        }
    }
};

/**
 * Verify if user is an owner
 */
async function verifyOwnerStatus(interaction) {
    return OWNER_USER_IDS.has(interaction.user.id);
}

/**
 * Check if user is one of the fixed owners (protected from moderation)
 */
function isFixedOwner(userId) {
    return OWNER_USER_IDS.has(userId);
}

/**
 * Check if role is high permission
 */
function isHighPermissionRole(roleId) {
    return HIGH_PERMISSION_ROLES.has(roleId);
}

/**
 * Send user selection menu
 */
async function sendUserSelectionMenu(interaction) {
    try {
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId('rang_user_select')
            .setPlaceholder('Wähle einen Benutzer aus...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(userSelect);

        const embed = createEmbed({
            title: '👥 Rang-Management',
            description: 'Wähle den Benutzer aus, dem du eine Rolle zuweisen oder entfernen möchtest.',
            color: 'primary'
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed],
            components: [row],
        });

        // Collect the user selection
        const filter = (i) => i.customId === 'rang_user_select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async (selectInteraction) => {
            try {
                const selectedUserId = selectInteraction.values[0];
                const selectedUser = await interaction.client.users.fetch(selectedUserId).catch(() => null);

                if (!selectedUser) {
                    return await InteractionHelper.safeReply(selectInteraction, {
                        embeds: [errorEmbed('Benutzer nicht gefunden.')],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Protect fixed owners
                if (isFixedOwner(selectedUserId)) {
                    return await InteractionHelper.safeReply(selectInteraction, {
                        embeds: [warningEmbed('Der geschützte Owner kann nicht moderiert werden.')],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                await selectInteraction.deferUpdate();
                await sendRoleSelectionMenu(selectInteraction, selectedUser);
                collector.stop();
            } catch (error) {
                logger.error('User selection error:', error);
                collector.stop();
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                InteractionHelper.safeEditReply(interaction, {
                    embeds: [warningEmbed('Zeitüberschreitung. Bitte versuche es erneut.')],
                    components: [],
                }).catch(() => { });
            }
        });

    } catch (error) {
        logger.error('Error sending user selection menu:', error);
        throw error;
    }
}

/**
 * Send role selection menu
 */
async function sendRoleSelectionMenu(interaction, selectedUser) {
    try {
        const member = await interaction.guild.members.fetch(selectedUser.id).catch(() => null);

        if (!member) {
            return await InteractionHelper.safeReply(interaction, {
                embeds: [errorEmbed(`${selectedUser.tag} ist kein Mitglied dieses Servers.`)],
                flags: MessageFlags.Ephemeral,
            });
        }

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('rang_role_select')
            .setPlaceholder('Wähle eine Rolle aus...')
            .setMinValues(1)
            .setMaxValues(1);

        const addButton = new ButtonBuilder()
            .setCustomId('rang_role_add')
            .setLabel('Hinzufügen')
            .setStyle(ButtonStyle.Success)
            .setEmoji('➕');

        const removeButton = new ButtonBuilder()
            .setCustomId('rang_role_remove')
            .setLabel('Entfernen')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('➖');

        const cancelButton = new ButtonBuilder()
            .setCustomId('rang_cancel')
            .setLabel('Abbrechen')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const selectRow = new ActionRowBuilder().addComponents(roleSelect);
        const buttonRow = new ActionRowBuilder().addComponents(addButton, removeButton, cancelButton);

        const userRoles = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .map(r => `<@&${r.id}>`)
            .join(', ') || 'Keine Rollen';

        const embed = createEmbed({
            title: `👥 Rollen für ${selectedUser.tag}`,
            description: `**Aktuelle Rollen:** ${userRoles}`,
            color: 'primary'
        }).addFields({
            name: 'Aktionen',
            value: 'Wähle eine Rolle aus und klicke auf eine der Schaltflächen.',
            inline: false
        });

        const message = await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed],
            components: [selectRow, buttonRow],
        });

        let selectedRoleId = null;

        // Collect role selection
        const roleFilter = (i) => i.customId === 'rang_role_select' && i.user.id === interaction.user.id;
        const roleCollector = interaction.channel.createMessageComponentCollector({ roleFilter, time: 300000 });

        roleCollector.on('collect', async (roleSelectInteraction) => {
            selectedRoleId = roleSelectInteraction.values[0];
            await roleSelectInteraction.deferUpdate();
        });

        // Collect button interactions
        const buttonFilter = (i) =>
            (i.customId === 'rang_role_add' || i.customId === 'rang_role_remove' || i.customId === 'rang_cancel')
            && i.user.id === interaction.user.id;

        const buttonCollector = interaction.channel.createMessageComponentCollector({ buttonFilter, time: 300000 });

        buttonCollector.on('collect', async (buttonInteraction) => {
            try {
                if (buttonInteraction.customId === 'rang_cancel') {
                    await buttonInteraction.deferUpdate();
                    roleCollector.stop();
                    buttonCollector.stop();
                    await InteractionHelper.safeEditReply(interaction, {
                        embeds: [infoEmbed('Aktion abgebrochen.')],
                        components: [],
                    });
                    return;
                }

                if (!selectedRoleId) {
                    return await InteractionHelper.safeReply(buttonInteraction, {
                        embeds: [errorEmbed('Bitte wähle zuerst eine Rolle aus.')],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                await buttonInteraction.deferUpdate();

                const role = interaction.guild.roles.cache.get(selectedRoleId);
                if (!role) {
                    return await InteractionHelper.safeReply(buttonInteraction, {
                        embeds: [errorEmbed('Rolle nicht gefunden.')],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Security checks
                if (isHighPermissionRole(selectedRoleId)) {
                    return await InteractionHelper.safeReply(buttonInteraction, {
                        embeds: [warningEmbed(`Die Rolle **${role.name}** hat hohe Berechtigungen und darf nicht zugewiesen werden.`)],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Protect fixed owners from role removal
                if (buttonInteraction.customId === 'rang_role_remove' && isFixedOwner(selectedUser.id)) {
                    return await InteractionHelper.safeReply(buttonInteraction, {
                        embeds: [warningEmbed('Du kannst dem geschützten Owner keine Rollen entfernen.')],
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (buttonInteraction.customId === 'rang_role_add') {
                    await handleRoleAdd(buttonInteraction, member, role, selectedUser, interaction.user);
                } else if (buttonInteraction.customId === 'rang_role_remove') {
                    await handleRoleRemove(buttonInteraction, member, role, selectedUser, interaction.user);
                }

                roleCollector.stop();
                buttonCollector.stop();
            } catch (error) {
                logger.error('Button interaction error:', error);
                await handleInteractionError(buttonInteraction, error);
            }
        });

        roleCollector.on('end', () => {
            if (buttonCollector.ended) return;
            buttonCollector.stop();
        });

        buttonCollector.on('end', () => {
            if (roleCollector.ended) return;
            roleCollector.stop();
        });

    } catch (error) {
        logger.error('Error sending role selection menu:', error);
        throw error;
    }
}

/**
 * Handle role addition
 */
async function handleRoleAdd(interaction, member, role, targetUser, executor) {
    try {
        // Check if user already has role
        if (member.roles.cache.has(role.id)) {
            return await InteractionHelper.safeReply(interaction, {
                embeds: [warningEmbed(`${targetUser.tag} hat die Rolle **${role.name}** bereits.`)],
                flags: MessageFlags.Ephemeral,
            });
        }

        // Check role hierarchy
        if (role.position >= interaction.member.roles.highest.position && !isFixedOwner(executor.id)) {
            return await InteractionHelper.safeReply(interaction, {
                embeds: [errorEmbed('Diese Rolle kann nicht zugewiesen werden (Hierarchie).')],
                flags: MessageFlags.Ephemeral,
            });
        }

        await member.roles.add(role);

        const caseId = await generateCaseId(interaction.client, interaction.guildId);
        await storeModerationCase({
            guildId: interaction.guildId,
            caseId,
            caseData: {
                action: 'Rolle hinzugefügt',
                target: `${targetUser.tag} (${targetUser.id})`,
                executor: `${executor.tag} (${executor.id})`,
                reason: `Rolle ${role.name} hinzugefügt`,
                metadata: {
                    userId: targetUser.id,
                    moderatorId: executor.id,
                    roleId: role.id,
                    roleName: role.name
                },
                targetUserId: targetUser.id,
                moderatorId: executor.id
            }
        });

        await logEvent({
            client: interaction.client,
            guild: interaction.guild,
            event: {
                action: 'Rolle hinzugefügt',
                target: `${targetUser.tag} (${targetUser.id})`,
                executor: `${executor.tag} (${executor.id})`,
                reason: `Rolle ${role.name} hinzugefügt`,
                caseId,
                metadata: {
                    userId: targetUser.id,
                    moderatorId: executor.id,
                    roleId: role.id,
                    roleName: role.name
                }
            }
        });

        const successEmbed_ = createEmbed({
            title: '✅ Rolle hinzugefügt',
            description: `**Benutzer:** ${targetUser.tag}\n**Rolle:** ${role}\n**Case ID:** #${caseId}`,
            color: 'success'
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [successEmbed_],
            components: [],
        });

        logger.info(`Role added: ${targetUser.id} received ${role.id} by ${executor.id}`, {
            guildId: interaction.guildId,
            userId: targetUser.id,
            moderatorId: executor.id
        });

    } catch (error) {
        logger.error('Error adding role:', error);
        throw error;
    }
}

/**
 * Handle role removal
 */
async function handleRoleRemove(interaction, member, role, targetUser, executor) {
    try {
        // Check if user has role
        if (!member.roles.cache.has(role.id)) {
            return await InteractionHelper.safeReply(interaction, {
                embeds: [warningEmbed(`${targetUser.tag} hat die Rolle **${role.name}** nicht.`)],
                flags: MessageFlags.Ephemeral,
            });
        }

        // Protect Owner role from removal
        if (role.id === OWNER_ROLE_ID) {
            return await InteractionHelper.safeReply(interaction, {
                embeds: [errorEmbed('Die Owner-Rolle darf nicht entfernt werden.')],
                flags: MessageFlags.Ephemeral,
            });
        }

        // Check role hierarchy
        if (role.position >= interaction.member.roles.highest.position && !isFixedOwner(executor.id)) {
            return await InteractionHelper.safeReply(interaction, {
                embeds: [errorEmbed('Diese Rolle kann nicht entfernt werden (Hierarchie).')],
                flags: MessageFlags.Ephemeral,
            });
        }

        await member.roles.remove(role);

        const caseId = await generateCaseId(interaction.client, interaction.guildId);
        await storeModerationCase({
            guildId: interaction.guildId,
            caseId,
            caseData: {
                action: 'Rolle entfernt',
                target: `${targetUser.tag} (${targetUser.id})`,
                executor: `${executor.tag} (${executor.id})`,
                reason: `Rolle ${role.name} entfernt`,
                metadata: {
                    userId: targetUser.id,
                    moderatorId: executor.id,
                    roleId: role.id,
                    roleName: role.name
                },
                targetUserId: targetUser.id,
                moderatorId: executor.id
            }
        });

        await logEvent({
            client: interaction.client,
            guild: interaction.guild,
            event: {
                action: 'Rolle entfernt',
                target: `${targetUser.tag} (${targetUser.id})`,
                executor: `${executor.tag} (${executor.id})`,
                reason: `Rolle ${role.name} entfernt`,
                caseId,
                metadata: {
                    userId: targetUser.id,
                    moderatorId: executor.id,
                    roleId: role.id,
                    roleName: role.name
                }
            }
        });

        const successEmbed_ = createEmbed({
            title: '✅ Rolle entfernt',
            description: `**Benutzer:** ${targetUser.tag}\n**Rolle:** ${role}\n**Case ID:** #${caseId}`,
            color: 'success'
        });

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [successEmbed_],
            components: [],
        });

        logger.info(`Role removed: ${targetUser.id} lost ${role.id} by ${executor.id}`, {
            guildId: interaction.guildId,
            userId: targetUser.id,
            moderatorId: executor.id
        });

    } catch (error) {
        logger.error('Error removing role:', error);
        throw error;
    }
}
