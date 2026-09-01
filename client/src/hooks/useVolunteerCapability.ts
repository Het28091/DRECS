'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyVolunteerAccess } from '@/lib/assignments';

/**
 * Determines whether the current user has volunteer capability.
 *
 * Volunteer capability is assignment-based: a user is considered a volunteer
 * if their role is 'volunteer' OR they have at least one active assignment.
 * Approved citizens who remain role 'citizen' but have an active assignment
 * therefore gain volunteer access without being permanently converted.
 */
export function useVolunteerCapability() {
  const { user, isAuthenticated } = useAuth();
  const [hasVolunteerCapability, setHasVolunteerCapability] = useState(false);
  const [activeAssignmentCount, setActiveAssignmentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isAuthenticated || !user) {
        if (!cancelled) {
          setHasVolunteerCapability(false);
          setActiveAssignmentCount(0);
          setIsLoading(false);
        }
        return;
      }

      // Permanent volunteers always have capability.
      if (user.role === 'volunteer') {
        if (!cancelled) {
          setHasVolunteerCapability(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const access = await fetchMyVolunteerAccess();
        if (!cancelled) {
          setHasVolunteerCapability(access.hasVolunteerCapability);
          setActiveAssignmentCount(access.activeAssignmentCount);
        }
      } catch {
        if (!cancelled) {
          setHasVolunteerCapability(false);
          setActiveAssignmentCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  return { hasVolunteerCapability, activeAssignmentCount, isLoading };
}
