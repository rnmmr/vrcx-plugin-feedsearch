# VRCX Feed Formula Search Plugin
[中文](./README_CN.md)

A VRCX custom plugin that enhances the friend feed search functionality with advanced formula-based filtering.

## Features
- Formula Search Syntax : Use expressions like name=Alice & type=GPS to search feed events
- Multiple Fields : Search by username (name), world, location (wrld), user ID (usr), status, avatar, bio, type, and time
- Logical Operators : Combine conditions with & (AND), | (OR), and != (NOT)
- Grouping : Use parentheses () to create complex queries like (name=Alice | name=Bob) & type=GPS
- Precise Time Filtering : Filter by specific dates using time=2025-04-19
- Bilingual Support : Switch between English and Chinese interface
- Dark Mode Compatible : Fully supports VRCX light/dark theme
## Supported Fields
Field Description Example name Username name=Alice world World name world=VRChat wrld World instance ID wrld=wrld_xxx usr User ID usr=usr_xxx status Status message status=在线 avatar Avatar name avatar=Robot bio User bio bio=developer type Event type type=GPS time Creation date time=2025-04-19

## Usage Examples
```
name=Alice & type=GPS        # Search 
Alice's GPS events
name=Alice | name=Bob        # Search 
Alice or Bob's events
type=GPS & world=Coffee Shop # Search 
GPS events in Coffee Shop
type!=Offline                # Exclude 
offline events
(name=Alice | name=Bob) & type=GPS # 
Combined conditions
```
## Installation
1. Copy custom.js to your %AppData%\VRCX\ directory
2. Restart VRCX
3. Find the "Feed Formula Search" card in the "Extension JS" category
## Note
Use = instead of : for field matching. This plugin intercepts search requests and applies formula filtering on top of VRCX's native search functionality.
