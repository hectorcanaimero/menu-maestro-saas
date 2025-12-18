
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** pideai
- **Date:** 2025-12-17
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Subdomain Routing Validity
- **Test Code:** [TC001_Subdomain_Routing_Validity.py](./TC001_Subdomain_Routing_Validity.py)
- **Test Error:** The task to verify that each store is uniquely identified and accessible via its functional subdomain was partially successful. Valid store subdomains load the store catalog and brand information correctly. However, attempts to access invalid or nonexistent subdomains resulted in browser-level errors (chrome-error://chromewebdata/) instead of application-level 404 error pages. This indicates a configuration or environment issue preventing full verification of 404 error handling for invalid subdomains. The issue has been reported. Task is now complete.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/782f45f7-9a23-4e01-aaf7-0d4fb276dfe4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Store Data Isolation via RLS
- **Test Code:** [TC002_Store_Data_Isolation_via_RLS.py](./TC002_Store_Data_Isolation_via_RLS.py)
- **Test Error:** Tested login as store owner A and verified store A's data is visible. Attempted to access store B's data via backend and UI but failed due to missing endpoints and UI options. Data isolation appears enforced but cannot fully confirm row-level security without proper access. Reporting issue and stopping further testing.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: net::ERR_CONNECTION_CLOSED (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=*&subdomain=eq.totus&is_active=eq.true:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/a42e2894-6acb-450f-9960-a291fd27f609
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** Customer Browsing and Catalog Viewing
- **Test Code:** [TC003_Customer_Browsing_and_Catalog_Viewing.py](./TC003_Customer_Browsing_and_Catalog_Viewing.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/c01ed26d-e929-4889-ba76-418f15da5e56
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** Shopping Cart Persistence and Product Extras
- **Test Code:** [TC004_Shopping_Cart_Persistence_and_Product_Extras.py](./TC004_Shopping_Cart_Persistence_and_Product_Extras.py)
- **Test Error:** Testing stopped due to missing or non-functional UI elements for adding products with customizable extras to the cart. The product detail page does not provide the necessary controls to proceed with the task. Please fix the website issue to enable further testing.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/abe27cb3-d202-4775-9b84-e28795a727ed
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Checkout Flow with Multi-Step Validation and Coupon Application
- **Test Code:** [TC005_Checkout_Flow_with_Multi_Step_Validation_and_Coupon_Application.py](./TC005_Checkout_Flow_with_Multi_Step_Validation_and_Coupon_Application.py)
- **Test Error:** The add to cart functionality is broken. The button does not add items to the cart and returns to the product listing page. This blocks the checkout flow testing. Reporting this issue and stopping further testing until fixed.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/7c2624f8-8867-4d03-8a25-e3e206261e18
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Real-time Order Notifications and Status Updates
- **Test Code:** [TC006_Real_time_Order_Notifications_and_Status_Updates.py](./TC006_Real_time_Order_Notifications_and_Status_Updates.py)
- **Test Error:** Testing stopped due to inability to access the 'Pedidos' section in the admin interface, which is critical for verifying real-time order notifications and order status updates. No real-time notifications or audio alerts were observed on the admin dashboard or other sections. Please investigate the UI navigation issue to enable proper testing.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/c70fd06b-e74b-48e2-a1e3-40b7f1b07ab2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Delivery Zones Configuration and Driver GPS Tracking
- **Test Code:** [TC007_Delivery_Zones_Configuration_and_Driver_GPS_Tracking.py](./TC007_Delivery_Zones_Configuration_and_Driver_GPS_Tracking.py)
- **Test Error:** Reported the navigation issue preventing access to delivery zones configuration page. Stopping further actions as the task cannot proceed without this access.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/4052c858-5115-41c1-9a46-050eb109c181
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** WhatsApp Notification Integration
- **Test Code:** [TC008_WhatsApp_Notification_Integration.py](./TC008_WhatsApp_Notification_Integration.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/30a416f7-0519-45b1-b075-3fc887c8f2da
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Subscription and Feature Gating Enforcement
- **Test Code:** [TC009_Subscription_and_Feature_Gating_Enforcement.py](./TC009_Subscription_and_Feature_Gating_Enforcement.py)
- **Test Error:** Subscription plan activation buttons are unresponsive, preventing further testing of feature limitations and upgrade prompts. Reporting this issue and stopping the test as per instructions.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/8600338a-6350-4fbd-82b0-a013d91efe53
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** User Authentication with Email Verification and Password Reset
- **Test Code:** [TC010_User_Authentication_with_Email_Verification_and_Password_Reset.py](./TC010_User_Authentication_with_Email_Verification_and_Password_Reset.py)
- **Test Error:** Stopped testing due to lack of accessible sign-up or login page on the website. Authentication workflows cannot be tested without access to the authentication interface.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/7467f1da-4b56-445f-a89f-6a085cbac8ee
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** Analytics Event Tracking and Reporting
- **Test Code:** [TC011_Analytics_Event_Tracking_and_Reporting.py](./TC011_Analytics_Event_Tracking_and_Reporting.py)
- **Test Error:** Add-to-cart functionality is broken, preventing further testing of funnel and cart event tracking. Reported the issue and stopped testing.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/b9cff832-1039-4ea4-8906-52ba10aa8aef
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Driver PWA Authentication and Delivery Workflow
- **Test Code:** [TC012_Driver_PWA_Authentication_and_Delivery_Workflow.py](./TC012_Driver_PWA_Authentication_and_Delivery_Workflow.py)
- **Test Error:** Stopped testing due to lack of access to driver login or dashboard. The website is not providing the necessary interface for driver authentication and delivery management as required by the task.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] 404 Error: User attempted to access non-existent route: /driver-login (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/6ca9c863-0fc5-4552-a4c0-8c242fff6c52
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** Payment Methods and Payment Proof Upload
- **Test Code:** [TC013_Payment_Methods_and_Payment_Proof_Upload.py](./TC013_Payment_Methods_and_Payment_Proof_Upload.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/be2b410d-1f93-41d5-a8bd-ef8d0e46e5f2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** Localization Support for Spanish Language and Dual Currency
- **Test Code:** [TC014_Localization_Support_for_Spanish_Language_and_Dual_Currency.py](./TC014_Localization_Support_for_Spanish_Language_and_Dual_Currency.py)
- **Test Error:** Test stopped due to inability to access settings or controls for currency display and exchange rate updates. Spanish UI and dual currency prices are visible, but further verification steps cannot be completed.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/a540a271-9d83-4bbe-b0c7-e7feb1af4474
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Live Chat Support Integration via Chatwoot
- **Test Code:** [TC015_Live_Chat_Support_Integration_via_Chatwoot.py](./TC015_Live_Chat_Support_Integration_via_Chatwoot.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/0c84a99e-58f0-43be-9b7b-67a170c6be5a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** AI-powered Photo Enhancement with Credit Deduction
- **Test Code:** [TC016_AI_powered_Photo_Enhancement_with_Credit_Deduction.py](./TC016_AI_powered_Photo_Enhancement_with_Credit_Deduction.py)
- **Test Error:** The AI photo enhancement feature is not found or accessible on the PideAI website. Testing cannot proceed as the feature is missing or inaccessible. Please provide access or fix the feature to enable testing.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/5e53e811-d649-43f6-a3df-93dffb1437ba
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017
- **Test Name:** Admin Dashboard Access Control
- **Test Code:** [TC017_Admin_Dashboard_Access_Control.py](./TC017_Admin_Dashboard_Access_Control.py)
- **Test Error:** Testing completed with the following results: 1) Access to admin dashboard without login is blocked and redirects to login page. 2) Login attempt with invalid non-owner credentials is rejected. 3) Authenticated store owner can access full admin features. 4) Logout works correctly. 5) Unable to test non-owner user login and access restrictions due to missing login/sign-in link on the public PideAI home page. Please address this issue to enable full access control testing.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] No session found: null (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/1b18196d-9866-4f6d-b638-d4e8d67cd3c5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018
- **Test Name:** Platform Uptime and Performance Testing
- **Test Code:** [TC018_Platform_Uptime_and_Performance_Testing.py](./TC018_Platform_Uptime_and_Performance_Testing.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/c6baa106-b25b-4b5c-99e7-8dbcfb62031e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019
- **Test Name:** Security Standards Compliance for Data Encryption and Privacy
- **Test Code:** [TC019_Security_Standards_Compliance_for_Data_Encryption_and_Privacy.py](./TC019_Security_Standards_Compliance_for_Data_Encryption_and_Privacy.py)
- **Test Error:** The website does not provide access to authentication or payment pages necessary for penetration testing and validation of encryption and privacy policies. Task cannot be completed as requested.
Browser Console Logs:
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
[ERROR] [usePostHogViewLimitStatus] Error fetching plan: {code: PGRST116, details: The result contains 0 rows, hint: null, message: Cannot coerce the result to a single JSON object} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 429 () (at https://o172702.ingest.us.sentry.io/api/4510482187878400/envelope/?sentry_version=7&sentry_key=63afd0c5a58daa15228eba85ac8356eb&sentry_client=sentry.javascript.react%2F10.29.0:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/exchange_rates?on_conflict=from_currency%2Cto_currency%2Cstore_id:0:0)
[ERROR] [BCV] Error upserting USD → VES: {code: 42501, details: null, hint: null, message: new row violates row-level security policy for table "exchange_rates"} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] [BCV] Error updating exchange rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] [BCV Auto-Update] Failed to update rates: Unknown error (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Document policy violation: js-profiling is not allowed in this document. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:28065:0)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/rpc/get_store_by_subdomain_secure:0:0)
[ERROR] Error loading store (RPC): {code: 42703, details: null, hint: null, message: column s.social_instagram does not exist} (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[WARNING] Falling back to direct query... (at http://localhost:8080/node_modules/.vite/deps/@sentry_react.js?v=6e4583f5:7243:37)
[ERROR] Failed to load resource: the server responded with a status of 406 () (at https://wdpexjymbiyjqwdttqhz.supabase.co/rest/v1/stores?select=id%2Csubscriptions%21inner%28status%2Csubscription_plans%21inner%28catalog_view_limit%29%29&id=eq.5958078d-b8fd-432a-8fb3-b01aa0957cb0&subscriptions.status=eq.active:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ac164a77-c37e-430d-91e2-67d17232b270/ca7b3878-774f-4aab-a3a3-d64ef76126c9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **10.53** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---