import { UserProfile, UserRole } from '../types';

const USER_BOX = 'civicloop_user_prefs';

export class UserRepository {
  
  private get _prefs(): UserProfile {
    try {
      const data = localStorage.getItem(USER_BOX);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("User Prefs Read Error", e);
    }
    // Default Empty State
    return { isProfileSetup: false };
  }

  private set _prefs(data: UserProfile) {
    try {
      localStorage.setItem(USER_BOX, JSON.stringify(data));
    } catch (e) {
      console.error("User Prefs Write Error", e);
    }
  }

  // --- Actions ---

  login(phoneNumber: string, token: string) {
    const current = this._prefs;
    this._prefs = {
      ...current,
      phoneNumber,
      authToken: token
    };
  }

  completeSetup(role: UserRole, wardId: string) {
    const current = this._prefs;
    this._prefs = {
      ...current,
      role,
      wardId,
      isProfileSetup: true
    };
  }

  updateRole(role: UserRole) {
    const current = this._prefs;
    this._prefs = {
      ...current,
      role
    };
  }

  logout() {
    localStorage.removeItem(USER_BOX);
  }

  // --- Getters ---

  isAuthenticated(): boolean {
    return !!this._prefs.authToken;
  }

  isProfileSetup(): boolean {
    return !!this._prefs.isProfileSetup;
  }

  getUser(): UserProfile {
    return this._prefs;
  }
}

export const userRepository = new UserRepository();