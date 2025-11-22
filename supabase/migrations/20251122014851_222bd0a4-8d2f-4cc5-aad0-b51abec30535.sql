-- Enable realtime for orders table (only set replica identity)
ALTER TABLE public.orders REPLICA IDENTITY FULL;