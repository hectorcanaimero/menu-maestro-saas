# Testing with Different Stores on Mobile

## Overview

When testing the app from your phone or any device, you can now easily switch between different stores by passing a URL parameter.

## How to Use

### Method 1: Using `?store=` parameter

Simply add `?store=STORE_NAME` to your URL:

```
http://192.168.1.10:8080?store=totus
http://192.168.1.10:8080?store=www
http://localhost:8080?store=mystore
```

### Method 2: Using `?subdomain=` parameter

Alternatively, you can use `?subdomain=` (works the same way):

```
http://192.168.1.10:8080?subdomain=totus
http://192.168.1.10:8080?subdomain=www
```

## What Happens

1. The app detects the URL parameter
2. Saves it to `localStorage` as `dev_subdomain`
3. Removes the parameter from the URL
4. Reloads the page to apply the new store

## Examples

### Testing the "totus" store from your phone:
1. Find your computer's IP address (e.g., `192.168.1.10`)
2. Start the dev server: `npm run dev`
3. On your phone, navigate to: `http://192.168.1.10:8080?store=totus`
4. The page will reload and you'll be on the "totus" store

### Switching to "www" (main domain):
```
http://192.168.1.10:8080?store=www
```

### Switching to any custom store:
```
http://192.168.1.10:8080?store=STORE_NAME
```

## Notes

- This only works in development mode (localhost or local IP addresses)
- The store name is saved in localStorage, so it persists across sessions
- To change stores again, just use the URL parameter again
- In production, the subdomain is automatically extracted from the hostname (e.g., `tienda1.pideai.com`)

## Checking Current Store

To see which store you're currently on in development:
1. Open DevTools (Console)
2. Type: `localStorage.getItem('dev_subdomain')`
3. You'll see the current store name

## Resetting

To reset to the default store ("totus"):
```
http://localhost:8080?store=totus
```

Or manually in DevTools Console:
```javascript
localStorage.setItem('dev_subdomain', 'totus')
location.reload()
```
