---
title: Test
date: 2025-05-29
---

<script src='https://www.google.com/recaptcha/api.js'></script>

<form action="https://sendy.lawak.ph/multi-subscribe.php" method="POST" accept-charset="utf-8" style="text-align: center; margin-top: 20px;">
  <div style="margin-bottom: 10px;">
    <input 
      type="email" 
      name="email" 
      id="email" 
      placeholder="Your email address" 
      style="display: inline-block; font-size: 16px; width: 100%; max-width: 300px; padding: 10px; box-sizing: border-box; border: 2px solid #d3d3d3; border-radius: 4px;" 
      required
    />
  </div>

  <!-- Newsletter checkboxes -->
  <div style="margin-bottom: 10px; text-align: left; display: inline-block;">
    <label>
      <input type="checkbox" name="lists[]" value="ph8UdQWpUrdDMORHhNAU9Q" checked />
      Umán (monthly)
    </label><br/>
    <label>
      <input type="checkbox" name="lists[]" value="zX1Mon0bSpW6R6Ujfy5KzA" checked />
      The Long Walk (occassional)
    </label>
  </div><br />

  <div class="g-recaptcha" data-sitekey="6LcAiicqAAAAAKuD_c7xD53NGHkwVaHgL3p4Ak1C" style="display: inline-block; margin-bottom: 10px;"></div><br />

  <div style="display: none;">
    <label for="hp">HP</label><br />
    <input type="text" name="hp" id="hp" />
  </div>

  <div style="margin-top: 10px;">
    <input 
      type="hidden" 
      name="subform" 
      value="yes" 
    />
    <input 
      type="submit" 
      name="submit" 
      id="submit" 
      value="Subscribe" 
      style="display: inline-block; font-size: 16px; padding: 10px 20px; width: auto; background-color: #7b97aa; color: white; border: none; border-radius: 4px; transition: transform 0.3s ease, background-color 0.3s ease;" 
      onmouseover="this.style.transform='scale(1.05)'" 
      onmouseout="this.style.transform='scale(1)'"
    />
  </div>
</form>
</div>
