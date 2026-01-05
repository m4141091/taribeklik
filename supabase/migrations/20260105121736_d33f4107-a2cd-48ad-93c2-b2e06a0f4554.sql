-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- User roles RLS policies (users can only see their own roles)
create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create sections table
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  height integer not null default 600,
  background_image_url text,
  background_color text default '#ffffff',
  elements jsonb default '[]',
  is_active boolean default false,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Enable RLS on sections
alter table public.sections enable row level security;

-- Sections RLS policies
create policy "Anyone can view active sections"
on public.sections for select
using (is_active = true);

create policy "Admins can view all sections"
on public.sections for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert sections"
on public.sections for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update sections"
on public.sections for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete sections"
on public.sections for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Trigger for automatic profile creation
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Trigger for sections updated_at
create trigger update_sections_updated_at
  before update on public.sections
  for each row
  execute function public.update_updated_at_column();

-- Create storage bucket for section assets
insert into storage.buckets (id, name, public)
values ('section-assets', 'section-assets', true);

-- Storage policies for section-assets bucket
create policy "Anyone can view section assets"
on storage.objects for select
using (bucket_id = 'section-assets');

create policy "Admins can upload section assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'section-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update section assets"
on storage.objects for update
to authenticated
using (bucket_id = 'section-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete section assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'section-assets' and public.has_role(auth.uid(), 'admin'));