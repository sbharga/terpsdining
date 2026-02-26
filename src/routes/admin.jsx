import { useLoaderData, useFetcher, Form, useNavigation } from 'react-router';
import { redirect } from 'react-router';
import { supabase } from '../api/supabase';
import { getAllFoods } from '../api/queries';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import ImageWithFallback from '../components/ui/ImageWithFallback';

export async function loader({ request }) {
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

  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  let foods;
  if (query) {
    const { data, error } = await supabase
      .from('foods')
      .select('id, name, allergens, avg_rating, rating_count, image_url')
      .ilike('name', `%${query}%`)
      .order('name');
    if (error) throw error;
    foods = data;
  } else {
    foods = await getAllFoods();
  }

  return { foods, query };
}

/** Inline form for uploading a food's image. */
function ImageForm({ food }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const error = fetcher.data?.error;

  return (
    <div className="space-y-1">
      <fetcher.Form method="post" encType="multipart/form-data" className="flex gap-2 items-center">
        <input type="hidden" name="foodId" value={food.id} />
        <input
          type="file"
          name="imageFile"
          accept=".jpg,.jpeg"
          className="flex-1 text-xs file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
          required
        />
        <Button type="submit" loading={isSubmitting} size="sm">
          Upload
        </Button>
      </fetcher.Form>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      {fetcher.data?.ok && <p className="text-[10px] text-green-500">Uploaded!</p>}
    </div>
  );
}

export async function action({ request }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Response('Forbidden', { status: 403 });

  const formData = await request.formData();
  const foodId = formData.get('foodId');
  const file = formData.get('imageFile');

  if (!file || file.size === 0) {
    return { error: 'No file selected' };
  }

  // Validate type: jpg/jpeg
  const isJpg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
  if (!isJpg) {
    return { error: 'Only JPG/JPEG images are allowed' };
  }

  // Validate size: < 500KB
  if (file.size > 500 * 1024) {
    return { error: 'File size must be less than 500KB' };
  }

  try {
    // Upload to Supabase Storage - rename to foodId.jpg
    const path = `${foodId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(path, file, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(path);

    // Update foods table
    const { error: updateError } = await supabase
      .from('foods')
      .update({ image_url: publicUrl })
      .eq('id', foodId);

    if (updateError) throw updateError;

    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

export default function AdminPage() {
  const { foods, query } = useLoaderData();
  const navigation = useNavigation();
  const isSearching = navigation.location && new URLSearchParams(navigation.location.search).has('q');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin - Image Management</h1>
          <p className="text-sm text-gray-500">
            {foods.length} food item{foods.length !== 1 ? 's' : ''} in the database.
          </p>
        </div>

        <Form method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search food..."
            className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </Form>
      </div>

      <Card className="overflow-hidden divide-y divide-gray-100">
        {isSearching ? (
          <div className="p-8 text-center text-sm text-gray-400">Searching...</div>
        ) : foods.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {query ? `No foods found matching "${query}"` : 'No foods in database.'}
          </div>
        ) : (
          foods.map((food) => (
            <div key={food.id} className="flex items-center gap-3 px-4 py-3">
              <ImageWithFallback
                src={food.image_url}
                alt={food.name}
                className="w-10 h-10 rounded-lg shrink-0"
                iconSize="text-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{food.name}</p>
                <div className="mt-1">
                  <ImageForm food={food} />
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
