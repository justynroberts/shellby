import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionProfile, ProfileGroup } from '../../../shared/types/connection';
import { Logger } from '../../utils/logger';

interface StoreSchema {
  profiles: Record<string, ConnectionProfile>;
  groups: Record<string, ProfileGroup>;
}

export class ConnectionManager {
  private store: Store<StoreSchema>;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ConnectionManager');
    this.store = new Store<StoreSchema>({
      name: 'connections',
      defaults: {
        profiles: {},
        groups: {},
      },
    });

    this.logger.info('ConnectionManager initialized');
  }

  // Profile Management
  async addProfile(profile: Omit<ConnectionProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    const newProfile: ConnectionProfile = {
      ...profile,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const profiles = this.store.get('profiles');
    profiles[id] = newProfile;
    this.store.set('profiles', profiles);

    this.logger.info('Profile added:', id, profile.name);
    return id;
  }

  async updateProfile(id: string, updates: Partial<ConnectionProfile>): Promise<void> {
    const profiles = this.store.get('profiles');
    const existing = profiles[id];

    if (!existing) {
      throw new Error('Profile not found');
    }

    profiles[id] = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    this.store.set('profiles', profiles);
    this.logger.info('Profile updated:', id);
  }

  async deleteProfile(id: string): Promise<void> {
    const profiles = this.store.get('profiles');

    if (!profiles[id]) {
      throw new Error('Profile not found');
    }

    delete profiles[id];
    this.store.set('profiles', profiles);

    // Remove from groups
    const groups = this.store.get('groups');
    Object.values(groups).forEach(group => {
      group.profileIds = group.profileIds.filter(pid => pid !== id);
    });
    this.store.set('groups', groups);

    this.logger.info('Profile deleted:', id);
  }

  async getProfile(id: string): Promise<ConnectionProfile | undefined> {
    const profiles = this.store.get('profiles');
    return profiles[id];
  }

  async listProfiles(): Promise<ConnectionProfile[]> {
    const profiles = this.store.get('profiles');
    return Object.values(profiles).sort((a, b) => {
      // Favorites first
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      // Then by last connected
      if (a.lastConnected && b.lastConnected) {
        return b.lastConnected.getTime() - a.lastConnected.getTime();
      }
      // Then by name
      return a.name.localeCompare(b.name);
    });
  }

  async updateLastConnected(id: string): Promise<void> {
    const profiles = this.store.get('profiles');
    const profile = profiles[id];

    if (profile) {
      profile.lastConnected = new Date();
      profile.updatedAt = new Date();
      this.store.set('profiles', profiles);
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    const profiles = this.store.get('profiles');
    const profile = profiles[id];

    if (profile) {
      profile.favorite = !profile.favorite;
      profile.updatedAt = new Date();
      this.store.set('profiles', profiles);
      this.logger.info('Profile favorite toggled:', id, profile.favorite);
    }
  }

  // Group Management
  async addGroup(group: Omit<ProfileGroup, 'id' | 'createdAt'>): Promise<string> {
    const id = uuidv4();
    const newGroup: ProfileGroup = {
      ...group,
      id,
      createdAt: new Date(),
    };

    const groups = this.store.get('groups');
    groups[id] = newGroup;
    this.store.set('groups', groups);

    this.logger.info('Group added:', id, group.name);
    return id;
  }

  async updateGroup(id: string, updates: Partial<ProfileGroup>): Promise<void> {
    const groups = this.store.get('groups');
    const existing = groups[id];

    if (!existing) {
      throw new Error('Group not found');
    }

    groups[id] = {
      ...existing,
      ...updates,
      id,
      createdAt: existing.createdAt,
    };

    this.store.set('groups', groups);
    this.logger.info('Group updated:', id);
  }

  async deleteGroup(id: string): Promise<void> {
    const groups = this.store.get('groups');

    if (!groups[id]) {
      throw new Error('Group not found');
    }

    delete groups[id];
    this.store.set('groups', groups);
    this.logger.info('Group deleted:', id);
  }

  async listGroups(): Promise<ProfileGroup[]> {
    const groups = this.store.get('groups');
    return Object.values(groups);
  }

  async getProfilesByGroup(groupId: string): Promise<ConnectionProfile[]> {
    const groups = this.store.get('groups');
    const group = groups[groupId];

    if (!group) {
      return [];
    }

    const profiles = this.store.get('profiles');
    return group.profileIds
      .map(id => profiles[id])
      .filter(p => p !== undefined);
  }

  // Import/Export
  async exportProfiles(): Promise<ConnectionProfile[]> {
    return this.listProfiles();
  }

  async importProfiles(profiles: Omit<ConnectionProfile, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const ids: string[] = [];

    for (const profile of profiles) {
      const id = await this.addProfile(profile);
      ids.push(id);
    }

    this.logger.info('Imported profiles:', ids.length);
    return ids;
  }

  // Search
  async searchProfiles(query: string): Promise<ConnectionProfile[]> {
    const profiles = await this.listProfiles();
    const lowerQuery = query.toLowerCase();

    return profiles.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.host.toLowerCase().includes(lowerQuery) ||
      p.username.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }
}
