/**
 * Owner Protection Utilities
 * Prevents fixed owners from being banned, timed out, or degraded
 */

const OWNER_USER_IDS = new Set(['1336263337117356055', '1371441403804254361']);
const OWNER_ROLE_ID = '1505921070585348156';

/**
 * Check if a user is one of the fixed owners (protected)
 * @param {string} userId - The user ID to check
 * @returns {boolean} True if user is a protected owner
 */
export function isProtectedOwner(userId) {
    return OWNER_USER_IDS.has(userId);
}

/**
 * Check if a user has the owner role
 * @param {GuildMember} member - The guild member to check
 * @returns {boolean} True if member has owner role
 */
export function hasOwnerRole(member) {
    if (!member) return false;
    return member.roles.cache.has(OWNER_ROLE_ID);
}

/**
 * Verify owner for command execution
 * @param {User} user - The user executing the command
 * @returns {boolean} True if user is an owner
 */
export function isCommandOwner(user) {
    return OWNER_USER_IDS.has(user.id);
}

/**
 * Get owner protection status
 * @param {User} targetUser - The target user
 * @param {GuildMember} targetMember - The target guild member
 * @returns {Object} Protection status info
 */
export function getOwnerProtectionStatus(targetUser, targetMember) {
    const isFixedOwner = isProtectedOwner(targetUser.id);
    const hasOwner = targetMember ? hasOwnerRole(targetMember) : false;

    return {
        isProtected: isFixedOwner,
        isFixedOwner,
        hasOwnerRole: hasOwner,
        level: isFixedOwner ? 'fixed' : (hasOwner ? 'role' : 'none')
    };
}

/**
 * Check if action is allowed on target
 * @param {User} targetUser - The target user
 * @param {GuildMember} targetMember - The target guild member
 * @param {string} action - The action being performed (ban, timeout, degrade, etc)
 * @returns {Object} Result object with allowed boolean and message
 */
export function canPerformAction(targetUser, targetMember, action) {
    const status = getOwnerProtectionStatus(targetUser, targetMember);

    const restrictedActions = ['ban', 'timeout', 'kick', 'degrade', 'warn'];

    if (status.isProtected && restrictedActions.includes(action.toLowerCase())) {
        return {
            allowed: false,
            message: `Der Benutzer **${targetUser.tag}** ist ein geschützter Owner und kann nicht ${action.toLowerCase()}t werden.`,
            reason: 'PROTECTED_OWNER'
        };
    }

    return {
        allowed: true,
        message: null,
        reason: null
    };
}

/**
 * Generate owner protection message for error handling
 * @param {User} targetUser - The target user
 * @param {GuildMember} targetMember - The target guild member
 * @returns {string} Protection message
 */
export function getProtectionMessage(targetUser, targetMember) {
    const status = getOwnerProtectionStatus(targetUser, targetMember);

    if (status.isFixedOwner) {
        return `**${targetUser.tag}** ist einer der festen Betreiber und genießt vollständigen Schutz. Diese Aktion ist nicht erlaubt.`;
    }

    if (status.hasOwnerRole) {
        return `**${targetUser.tag}** hat die Owner-Rolle und kann nicht moderiert werden.`;
    }

    return null;
}

export { OWNER_USER_IDS, OWNER_ROLE_ID };
