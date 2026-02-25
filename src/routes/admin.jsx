import { useLoaderData, useFetcher } from 'react-router';
import { redirect } from 'react-router';
import { supabase } from '../api/supabase';
import { getAllFoods } from '../api/queries';

export async function loader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw redirect('/');

  const foods = await getAllFoods();
  return { foods };
}

/** Inline form for updating a food's image_url. */
function ImageForm({ food }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <fetcher.Form method="post" className="flex gap-2 items-center">
      <input type="hidden" name="foodId" value={food.id} />
      <input
        type="url"
        name="imageUrl"
        defaultValue={food.image_url ?? ''}
        placeholder="https://…"
        className="flex-1 text-xs rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#E21833]"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="text-xs rounded bg-[#E21833] text-white px-3 py-1 hover:bg-[#c01028] disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Save'}
      </button>
    </fetcher.Form>
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const foodId = formData.get('foodId');
  const imageUrl = formData.get('imageUrl') || null;

  const { error } = await supabase
    .from('foods')
    .update({ image_url: imageUrl })
    .eq('id', foodId);

  if (error) throw new Response(error.message, { status: 500 });
  return { ok: true };
}

export default function AdminPage() {
  const { foods } = useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin – Image Management</h1>
      <p className="text-sm text-gray-500">
        {foods.length} food item{foods.length !== 1 ? 's' : ''} in the database.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
        {foods.map((food) => (
          <div key={food.id} className="flex items-center gap-3 px-4 py-3">
            {food.image_url ? (
              <img
                src={food.image_url}
                alt={food.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                🍽️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{food.name}</p>
              <div className="mt-1">
                <ImageForm food={food} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
