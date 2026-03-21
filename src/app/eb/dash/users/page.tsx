'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Input, Modal, FormLabel } from '@/components/ui';
import { displayRole } from '@/lib/roles';

export default function EBUsersPage() {
  const [users, setUsers] = useState<Record<string, any>[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Record<string, any>[]>([]);
  const [selectedUser, setSelectedUser] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (statusFilter !== 'ALL') {
      result = result.filter(u => u.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        (u.full_name?.toLowerCase() || '').includes(term) ||
        (u.email?.toLowerCase() || '').includes(term)
      );
    }

    setFilteredUsers(result);
  }, [searchTerm, statusFilter, users]);

  const handleStatusChange = async (user_id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user_id);
        
      if (error) throw error;
      
      setUsers(users.map(u => u.id === user_id ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleRoleChange = async (user_id: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', user_id);
        
      if (error) throw error;
      
      setUsers(users.map(u => u.id === user_id ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-inter">
      <div>
        <h1 className="font-jotia-bold text-2xl text-text-primary mb-2">User Management</h1>
        <p className="text-text-dimmed">Manage all registered users and their access.</p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 bg-bg-card border-border-subtle">
        <div className="flex-1">
          <Input 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-bg-raised border-border-input"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-button text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                statusFilter === status 
                  ? 'bg-text-primary text-bg-base shadow-lg' 
                  : 'bg-bg-raised text-text-dimmed hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      <div className="bg-bg-card border border-border-subtle rounded-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-raised/50">
                <th className="p-5 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">User</th>
                <th className="p-5 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">Role</th>
                <th className="p-5 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">Committee</th>
                <th className="p-5 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">Status</th>
                <th className="p-5 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-bg-raised/20 transition-colors group">
                  <td className="p-5">
                    <div className="font-bold text-text-primary group-hover:text-black dark:group-hover:text-white transition-colors">{user.full_name}</div>
                    <div className="text-xs text-text-dimmed mt-0.5">{user.email}</div>
                  </td>
                  <td className="p-5">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-text-primary focus:ring-0 cursor-pointer uppercase tracking-wider p-0 dark:bg-bg-card"
                    >
                      <option value="DELEGATE">Delegate</option>
                      <option value="CHAIR">Chair</option>
                      <option value="MEDIA">Press / Media</option>
                      <option value="SECURITY">Security</option>
                      <option value="EXECUTIVE_BOARD">Executive Board</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="SECRETARY_GENERAL">Secretary General</option>
                      <option value="DEPUTY_SECRETARY_GENERAL">Deputy Sec Gen</option>
                    </select>
                  </td>
                  <td className="p-5 text-xs font-medium text-text-secondary tracking-wide">{user.preferred_committee || '-'}</td>
                  <td className="p-5">
                    <Badge variant={user.status.toLowerCase()} className="text-[9px] px-2 py-0.5">{user.status}</Badge>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="text-xs px-3 py-1 bg-bg-raised text-text-dimmed border border-border-subtle rounded-button hover:bg-bg-hover"
                      >
                        Info
                      </button>
                      {user.status === 'PENDING' && (
                        <button 
                          onClick={() => handleStatusChange(user.id, 'APPROVED')}
                          className="text-xs px-3 py-1 bg-status-approved-bg text-status-approved-text border border-status-approved-border rounded-button hover:brightness-95"
                        >
                          Approve
                        </button>
                      )}
                      {user.status === 'APPROVED' && (
                        <button 
                          onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                          className="text-xs px-3 py-1 bg-yellow-500 text-white border border-yellow-600 rounded-button hover:brightness-95"
                        >
                          Suspend
                        </button>
                      )}
                       <button 
                        onClick={() => handleStatusChange(user.id, 'REJECTED')}
                        className="text-xs px-3 py-1 bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border rounded-button hover:brightness-95"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <p className="text-text-dimmed text-sm font-medium">No users found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)}>
          <h2 className="font-jotia text-2xl text-text-primary mb-6">User Information</h2>
          <div className="space-y-4">
            <div>
              <FormLabel>Full Name</FormLabel>
              <p className="text-text-primary">{selectedUser.full_name}</p>
            </div>
            <div>
              <FormLabel>Email</FormLabel>
              <p className="text-text-primary">{selectedUser.email}</p>
            </div>
            <div>
              <FormLabel>Department</FormLabel>
              <p className="text-text-primary">{displayRole(selectedUser.role)}</p>
            </div>
            {selectedUser.role === 'DELEGATE' && (
              <>
                <div>
                  <FormLabel>Committee</FormLabel>
                  <p className="text-text-primary">{selectedUser.preferred_committee}</p>
                </div>
                <div>
                  <FormLabel>Country</FormLabel>
                  <p className="text-text-primary">{selectedUser.allocated_country}</p>
                </div>
              </>
            )}
            <div>
              <FormLabel>Date of Birth</FormLabel>
              <p className="text-text-primary">{selectedUser.date_of_birth}</p>
            </div>
            <div>
              <FormLabel>Phone Number</FormLabel>
              <p className="text-text-primary">{selectedUser.phone_number}</p>  
            </div>
            <div>
              <FormLabel>Dietary Restrictions</FormLabel>
              <p className="text-text-primary">{selectedUser.dietary_restrictions || 'None'}</p>  
            </div>
            <div>
              <FormLabel>Emergency Contact</FormLabel>
              <p className="text-text-primary">{selectedUser.emergency_contact_name} ({selectedUser.emergency_contact_relation}) - {selectedUser.emergency_contact_phone}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}