# on-this-day-photos-js

## Problem

- Send out, in the morning, all the media that happened on this day in the previous years
- OneDrive does this but it is not split across directories, all media generates one link
- The link does not have anonymous access
- Clicking on the link must re-compute the media because it is very slow

## Solution

- Do not use 3rd party to find media "on this day", use powershell to filter all media created on current day number and current month number
  - Tried to just use Nodejs to find media but much slower than using powershell
  - Having correct created on day related to this repo = https://github.com/stldev/set-file-dates-js
- Then copy filtered media files to local NAS that can be split across multiple users with their own access
- Send email at same time every morning
- The files are copies and saved to disk so no compute needed when hitting url for a day
