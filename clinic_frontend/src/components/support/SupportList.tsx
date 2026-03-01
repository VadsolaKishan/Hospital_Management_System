import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { ButtonLoader } from '@/components/common/Loader';
import { notificationService, Query } from '@/services/notificationService';
import { formatRelativeTime, capitalizeFirst } from '@/utils/helpers';
import { ROLES } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const SupportList = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [newQuery, setNewQuery] = useState({ subject: '', message: '' });
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const data = await notificationService.getQueries();
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch queries:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load support queries',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuery.subject.trim() || !newQuery.message.trim()) return;

    setIsSubmitting(true);
    try {
      await notificationService.createQuery(newQuery);
      toast({
        title: 'Query Submitted',
        description: 'Your support query has been submitted successfully',
      });
      setShowNewModal(false);
      setNewQuery({ subject: '', message: '' });
      fetchQueries();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit query',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedQuery || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await notificationService.replyToQuery(selectedQuery.id, replyText);
      toast({
        title: 'Reply Sent',
        description: 'Your reply has been sent successfully',
      });
      setShowReplyModal(false);
      setSelectedQuery(null);
      setReplyText('');
      fetchQueries();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send reply',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === ROLES.ADMIN;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support</h1>
          <p className="text-muted-foreground">Get help and submit queries</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-gradient flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Query
        </button>
      </div>

      {/* Queries List */}
      <div className="space-y-4">
        {queries.length > 0 ? (
          queries.map((query) => (
            <div
              key={query.id}
              className="glass-card rounded-2xl p-6 card-hover"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      query.status === 'OPEN' ? 'bg-warning/10' : 'bg-success/10'
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        'h-5 w-5',
                        query.status === 'OPEN' ? 'text-warning' : 'text-success'
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{query.subject}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(query.created_at)}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    'badge',
                    query.status === 'OPEN' ? 'badge-pending' : 'badge-approved'
                  )}
                >
                  {capitalizeFirst(query.status)}
                </span>
              </div>

              <p className="text-muted-foreground mb-4">{query.message}</p>

              {query.reply && (
                <div className="rounded-xl bg-success/5 border border-success/20 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">Admin Reply</span>
                  </div>
                  <p className="text-foreground">{query.reply}</p>
                </div>
              )}

              {isAdmin && query.status === 'OPEN' && (
                <button
                  onClick={() => {
                    setSelectedQuery(query);
                    setShowReplyModal(true);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Reply
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No support queries</h3>
            <p className="text-muted-foreground mb-6">
              Need help? Submit a query and our team will get back to you.
            </p>
            <button onClick={() => setShowNewModal(true)} className="btn-gradient">
              Create Support Query
            </button>
          </div>
        )}
      </div>

      {/* New Query Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Support Query"
        size="md"
      >
        <form onSubmit={handleCreateQuery} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Subject
            </label>
            <input
              type="text"
              value={newQuery.subject}
              onChange={(e) => setNewQuery({ ...newQuery, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message
            </label>
            <textarea
              value={newQuery.message}
              onChange={(e) => setNewQuery({ ...newQuery, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              rows={5}
              className="input-field resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="rounded-xl px-4 py-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gradient flex items-center gap-2"
            >
              {isSubmitting ? <ButtonLoader /> : 'Submit Query'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reply Modal */}
      <Modal
        isOpen={showReplyModal}
        onClose={() => {
          setShowReplyModal(false);
          setSelectedQuery(null);
        }}
        title="Reply to Query"
        size="md"
      >
        <div className="space-y-6">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Original Query:</p>
            <p className="font-medium text-foreground">{selectedQuery?.subject}</p>
            <p className="mt-2 text-muted-foreground">{selectedQuery?.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Reply
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={5}
              className="input-field resize-none"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowReplyModal(false)}
              className="rounded-xl px-4 py-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReply}
              disabled={isSubmitting || !replyText.trim()}
              className="btn-gradient flex items-center gap-2"
            >
              {isSubmitting ? <ButtonLoader /> : 'Send Reply'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
