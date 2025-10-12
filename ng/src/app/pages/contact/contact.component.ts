import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'responded' | 'closed';
  date: string;
  priority: 'low' | 'medium' | 'high';
}

interface ContactStats {
  totalMessages: number;
  newMessages: number;
  respondedMessages: number;
  avgResponseTime: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.sass'
})
export class ContactComponent implements OnInit {
  activeTab: 'messages' | 'analytics' = 'messages';
  messages: ContactMessage[] = [];
  stats: ContactStats = {
    totalMessages: 0,
    newMessages: 0,
    respondedMessages: 0,
    avgResponseTime: '2h'
  };

  isLoading = false;
  searchQuery = '';
  selectedMessages: Set<string> = new Set();

  constructor(
    public lang: LanguageService,
    private supabase: SupabaseService,
    private toast: ToastService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadContactMessages();
  }

  async loadContactMessages() {
    this.isLoading = true;
    try {
      const user = this.supabase.currentUser;
      if (!user) return;

      // Fetch contact messages from the database
      // For now, using mock data - replace with actual DB call
      this.messages = this.getMockMessages();

      this.updateStats();
    } catch (error) {
      console.error('Error loading contact messages:', error);
      this.toast.show('Failed to load contact messages', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private getMockMessages(): ContactMessage[] {
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '050-1234567',
        subject: 'Question about pricing',
        message: 'Hello, I would like to know more about your pricing plans...',
        status: 'new',
        date: new Date().toISOString(),
        priority: 'high'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Technical support needed',
        message: 'I am having trouble accessing my account...',
        status: 'responded',
        date: new Date(Date.now() - 86400000).toISOString(),
        priority: 'medium'
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '052-9876543',
        subject: 'Partnership inquiry',
        message: 'We are interested in partnering with your company...',
        status: 'new',
        date: new Date(Date.now() - 172800000).toISOString(),
        priority: 'medium'
      }
    ];
  }

  private updateStats() {
    this.stats.totalMessages = this.messages.length;
    this.stats.newMessages = this.messages.filter(m => m.status === 'new').length;
    this.stats.respondedMessages = this.messages.filter(m => m.status === 'responded').length;
  }

  getFilteredMessages(): ContactMessage[] {
    if (!this.searchQuery) {
      return this.messages;
    }

    const query = this.searchQuery.toLowerCase();
    return this.messages.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.subject.toLowerCase().includes(query) ||
      m.message.toLowerCase().includes(query)
    );
  }

  getStatusLabel(status: ContactMessage['status']): string {
    const labels: Record<ContactMessage['status'], { he: string; en: string }> = {
      new: { he: 'חדש', en: 'New' },
      responded: { he: 'נענה', en: 'Responded' },
      closed: { he: 'סגור', en: 'Closed' }
    };
    return this.lang.currentLanguage === 'he' ? labels[status].he : labels[status].en;
  }

  getPriorityLabel(priority: ContactMessage['priority']): string {
    const labels: Record<ContactMessage['priority'], { he: string; en: string }> = {
      low: { he: 'נמוך', en: 'Low' },
      medium: { he: 'בינוני', en: 'Medium' },
      high: { he: 'גבוה', en: 'High' }
    };
    return this.lang.currentLanguage === 'he' ? labels[priority].he : labels[priority].en;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return this.lang.currentLanguage === 'he' ? 'לפני רגע' : 'Just now';
    } else if (diffHours < 24) {
      return this.lang.currentLanguage === 'he'
        ? `לפני ${diffHours} שעות`
        : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return this.lang.currentLanguage === 'he'
        ? `לפני ${diffDays} ימים`
        : `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(this.lang.currentLanguage === 'he' ? 'he-IL' : 'en-US');
    }
  }

  toggleMessageSelection(messageId: string) {
    if (this.selectedMessages.has(messageId)) {
      this.selectedMessages.delete(messageId);
    } else {
      this.selectedMessages.add(messageId);
    }
  }

  toggleSelectAll() {
    if (this.selectedMessages.size === this.messages.length) {
      this.selectedMessages.clear();
    } else {
      this.messages.forEach(m => this.selectedMessages.add(m.id));
    }
  }

  isMessageSelected(messageId: string): boolean {
    return this.selectedMessages.has(messageId);
  }

  viewMessage(message: ContactMessage) {
    // Navigate to message detail view or open modal
    console.log('View message:', message);
    this.toast.show('Opening message...', 'info');
  }

  respondToMessage(message: ContactMessage) {
    // Open email client or response modal
    window.location.href = `mailto:${message.email}?subject=Re: ${message.subject}`;
  }

  markAsRead(message: ContactMessage) {
    message.status = 'responded';
    this.updateStats();
    this.toast.show('Message marked as read', 'success');
  }

  deleteMessage(message: ContactMessage) {
    const index = this.messages.findIndex(m => m.id === message.id);
    if (index > -1) {
      this.messages.splice(index, 1);
      this.updateStats();
      this.toast.show('Message deleted', 'success');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  exportMessages() {
    this.toast.show('Exporting messages...', 'info');
    // Implement export functionality
  }
}
