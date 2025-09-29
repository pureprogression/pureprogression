import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function FavoritesList() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => {
      if (!u) {
        setUser(null);
        setItems([]);
        setLoading(false);
        return;
      }
      setUser(u);
      const q = query(
        collection(db, 'users', u.uid, 'favorites'),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q,
        snap => {
          setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        err => {
          setError(err);
          setLoading(false);
        }
      );
      return () => unsub();
    });
    return () => unsubAuth();
  }, []);

  if (!user) return <p>Войдите, чтобы увидеть избранное</p>;
  if (loading) return <p>Загрузка…</p>;
  if (error) return <p>Ошибка: {error.message}</p>;

  if (items.length === 0) return <p>Пусто</p>;
  return (
    <ul>
      {items.map(it => (
        <li key={it.id}>{it.title}</li>
      ))}
    </ul>
  );
}
