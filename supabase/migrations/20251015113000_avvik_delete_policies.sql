-- Add delete RLS policies for work_order_time_adjustments (avvik) and cascade for attachments

-- 1) Allow users to delete their own adjustments if they have access to the work order
create policy if not exists "Users can delete their own adjustments"
on public.work_order_time_adjustments
for delete
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.work_orders wo
    where wo.id = work_order_time_adjustments.work_order_id
      and (
        wo.user_id = auth.uid() or
        wo.assigned_to = auth.uid()
      )
  )
);

-- (optional) Admins can delete any adjustment if is_admin() helper exists
do $$ begin
  perform 1
  from pg_proc
  where proname = 'is_admin';
  if found then
    execute $$
      create policy if not exists "Admins can delete adjustments"
      on public.work_order_time_adjustments
      for delete
      using (is_admin());
    $$;
  end if;
end $$;

-- 2) Ensure adjustment_attachments has FK with ON DELETE CASCADE
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'adjustment_attachments_adjustment_id_fkey'
      and table_name = 'adjustment_attachments'
  ) then
    alter table public.adjustment_attachments
    add constraint adjustment_attachments_adjustment_id_fkey
    foreign key (adjustment_id)
    references public.work_order_time_adjustments(id)
    on delete cascade;
  end if;
end $$;

-- 3) Attachments policies based on access to parent adjustment/work order
create policy if not exists "Users can select attachments via adjustment access"
on public.adjustment_attachments
for select
using (
  exists (
    select 1
    from public.work_order_time_adjustments a
    join public.work_orders wo on wo.id = a.work_order_id
    where a.id = adjustment_attachments.adjustment_id
      and (
        wo.user_id = auth.uid() or
        wo.assigned_to = auth.uid() or
        (exists (select 1 from pg_proc where proname = 'is_admin') and is_admin())
      )
  )
);

create policy if not exists "Users can delete attachments they can access"
on public.adjustment_attachments
for delete
using (
  exists (
    select 1
    from public.work_order_time_adjustments a
    join public.work_orders wo on wo.id = a.work_order_id
    where a.id = adjustment_attachments.adjustment_id
      and (
        wo.user_id = auth.uid() or
        wo.assigned_to = auth.uid() or
        (exists (select 1 from pg_proc where proname = 'is_admin') and is_admin())
      )
  )
);


