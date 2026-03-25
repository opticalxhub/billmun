'use client';

import React, { useEffect, useState } from 'react';
import { EBLayout } from '@/components/eb-layout';
import { Card, Badge } from '@/components/ui';
import { Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  date_of_birth: string;
  grade: string;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  role: string;
  created_at: string;
  approved_at?: string;
}

export default function EBUsersPage() {
  const [activeTab, setActiveTab] = useState<string>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: allUsers, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, status, date_of_birth, grade, phone_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, dietary_restrictions, preferred_committee, allocated_country, has_completed_onboarding, badge_status, profile_image_url, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (allUsers) {
          setUsers(allUsers as UserData[]);
          setFilteredUsers(allUsers as UserData[]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.phone_number.includes(term)
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'approved';
      case 'PENDING':
        return 'pending';
      case 'REJECTED':
        return 'rejected';
      case 'SUSPENDED':
        return 'rejected';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <EBLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="min-h-screen bg-bg-base p-6 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair font-bold text-heading-1 text-text-primary mb-2">
            Portal Registrations
          </h1>
          <p className="text-subtitle text-text-dimmed">
            View and manage all registered participants
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-bg-raised border border-border-input rounded-input px-3.5 h-10 font-inter text-form-input text-text-primary focus:border-text-primary transition-colors duration-150"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-card-body text-text-dimmed mb-1">Total Users</div>
            <div className="text-heading-2 font-bold text-text-primary">{users.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-card-body text-text-dimmed mb-1">Pending</div>
            <div className="text-heading-2 font-bold text-text-primary">
              {users.filter((u) => u.status === 'PENDING').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-card-body text-text-dimmed mb-1">Approved</div>
            <div className="text-heading-2 font-bold text-text-primary">
              {users.filter((u) => u.status === 'APPROVED').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-card-body text-text-dimmed mb-1">Rejected</div>
            <div className="text-heading-2 font-bold text-text-primary">
              {users.filter((u) => u.status === 'REJECTED').length}
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-text-dimmed">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-text-dimmed">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-raised">
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Age
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Emergency Contact
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-table-header text-text-secondary font-semibold">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-hover transition-colors duration-150">
                      <td className="px-4 py-3 font-inter text-table-cell text-text-primary font-medium">
                        {user.full_name}
                      </td>
                      <td className="px-4 py-3 font-inter text-table-cell text-text-dimmed">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 font-inter text-table-cell text-text-dimmed">
                        {calculateAge(user.date_of_birth)} years
                      </td>
                      <td className="px-4 py-3 font-inter text-table-cell text-text-dimmed">
                        {user.grade?.replace('GRADE_', '')}
                      </td>
                      <td className="px-4 py-3 font-inter text-table-cell text-text-dimmed">
                        {user.phone_number}
                      </td>
                      <td className="px-4 py-3 font-inter text-table-cell text-text-dimmed">
                        <div className="text-xs">{user.emergency_contact_name}</div>
                        <div className="text-xs text-text-tertiary">
                          {user.emergency_contact_relation}
                        </div>
                        <div className="text-xs text-text-tertiary">{user.emergency_contact_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusColor(user.status) as any}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-inter text-timestamp text-text-tertiary">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-text-tertiary text-small">
          <p>Showing {filteredUsers.length} of {users.length} registrations</p>
        </div>
      </div>
    </EBLayout>
  );
}
