import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api, errorMessage } from '../../lib/api';
import { useComments } from '../../lib/queries';
import { timeAgo } from '../../lib/format';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import UserLink from '../ui/UserLink';
import { CommentIcon, TrashIcon } from '../ui/Icons';

const VISIBLE_REPLIES = 2; // more than this → "Show more replies"

// The API returns a flat list with parent_id. Group it Instagram-style:
// top-level comments, each with ALL its replies (and replies-to-replies) in one list under it.
function buildThreads(comments) {
  const byId = new Map(comments.map((c) => [c.id, c]));
  const rootOf = (c) => {
    let cur = c;
    while (cur.parent_id && byId.has(cur.parent_id)) cur = byId.get(cur.parent_id);
    return cur.id;
  };
  const threads = new Map();
  for (const c of comments) if (!c.parent_id) threads.set(c.id, { comment: c, replies: [] });
  for (const c of comments) {
    if (!c.parent_id) continue;
    const thread = threads.get(rootOf(c));
    if (thread) thread.replies.push({ ...c, replyingTo: byId.get(c.parent_id)?.author });
  }
  return [...threads.values()];
}

function CommentForm({ reviewId, parentId, replyingTo, autoFocus, onDone, onCancel }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const add = useMutation({
    mutationFn: () => api.post(`/reviews/${reviewId}/comments`, { body, parentId }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] }); // comment counts on cards
      onDone?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (body.trim()) add.mutate();
      }}
      className="flex gap-3"
    >
      <Avatar user={user} size={parentId ? 'size-7' : 'size-9'} />
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={parentId ? 1 : 2}
          maxLength={1000}
          autoFocus={autoFocus}
          placeholder={replyingTo ? `Reply to @${replyingTo.username}…` : 'Ridden it too? Add your take…'}
          className="input"
        />
        {add.isError && <p className="mt-1 text-sm text-red-400">{errorMessage(add.error)}</p>}
        <div className="mt-2 flex gap-2">
          <button disabled={add.isPending || !body.trim()} className="btn-primary py-1.5">
            {add.isPending ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="btn-ghost py-1.5">Cancel</button>}
        </div>
      </div>
    </form>
  );
}

function CommentItem({ comment, reviewId, small, onReply }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => api.delete(`/reviews/${reviewId}/comments/${comment.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  return (
    <div className="flex gap-3">
      <UserLink username={comment.author.username}>
        <Avatar user={comment.author} size={small ? 'size-7' : 'size-8'} />
      </UserLink>
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-zinc-900 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <UserLink username={comment.author.username} className="font-semibold">{comment.author.display_name}</UserLink>
            <span className="text-xs text-zinc-500">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-line break-words text-zinc-300">
            {comment.replyingTo && (
              <UserLink username={comment.replyingTo.username} className="mr-1 font-medium text-brand-400">
                @{comment.replyingTo.username}
              </UserLink>
            )}
            {comment.body}
          </p>
        </div>
        <div className="mt-1 flex gap-4 px-2 text-xs font-semibold text-zinc-500">
          {user && <button onClick={() => onReply(comment)} className="hover:text-zinc-200">Reply</button>}
          {user?.id === comment.author.id && (
            <button
              onClick={() => window.confirm('Delete this comment and its replies?') && remove.mutate()}
              className="flex items-center gap-1 hover:text-red-400"
            >
              <TrashIcon className="size-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Thread({ thread, reviewId }) {
  const [expanded, setExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // the comment being replied to
  const { replies } = thread;
  const shown = expanded ? replies : replies.slice(0, VISIBLE_REPLIES);
  const hidden = replies.length - shown.length;

  return (
    <li>
      <CommentItem comment={thread.comment} reviewId={reviewId} onReply={setReplyTo} />
      {(replies.length > 0 || replyTo) && (
        <div className="ml-11 mt-3 space-y-3 border-l-2 border-zinc-800 pl-4">
          {shown.map((r) => <CommentItem key={r.id} comment={r} reviewId={reviewId} small onReply={setReplyTo} />)}
          {hidden > 0 && (
            <button onClick={() => setExpanded(true)} className="text-sm font-semibold text-brand-400 hover:underline">
              Show {hidden} more {hidden === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {expanded && replies.length > VISIBLE_REPLIES && (
            <button onClick={() => setExpanded(false)} className="text-sm font-semibold text-zinc-500 hover:underline">
              Show less
            </button>
          )}
          {replyTo && (
            <CommentForm
              key={replyTo.id}
              reviewId={reviewId}
              parentId={replyTo.id}
              replyingTo={replyTo.author}
              autoFocus
              onDone={() => {
                setReplyTo(null);
                setExpanded(true); // so the new reply is visible
              }}
              onCancel={() => setReplyTo(null)}
            />
          )}
        </div>
      )}
    </li>
  );
}

export default function Comments({ reviewId }) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(reviewId);
  const threads = useMemo(() => buildThreads(comments), [comments]);

  return (
    <section id="comments" className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 font-display text-3xl tracking-wide">
        <CommentIcon className="size-6" /> Comments ({comments.length})
      </h2>

      {user ? (
        <div className="mb-8"><CommentForm reviewId={reviewId} /></div>
      ) : (
        <p className="card mb-6 p-4 text-sm text-zinc-400">
          <Link to="/login" className="font-semibold text-brand-400">Log in</Link> to join the conversation.
        </p>
      )}

      {isLoading ? <Spinner /> : (
        <ul className="space-y-6">
          {threads.map((t) => <Thread key={t.comment.id} thread={t} reviewId={reviewId} />)}
        </ul>
      )}
    </section>
  );
}
