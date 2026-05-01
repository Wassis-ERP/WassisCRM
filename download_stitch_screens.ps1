$outDir = "c:\Users\Renato - W.Assis\OneDrive - wassis.com.br\Documentos\Gestor Wassis\CRM\stitch_screens"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }

# 1. Segurados
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0ugOzZTg5Ux-G9X4QZqjcmr4YrUL02KZkdAdEE6Q2-gfVbPPTPin2s6G-JA99_CJ8q5RQUQcgZ5wcIjULdZkXQncpRdIrAy4BU5J8AkqwZBi2O7WSgoWNSMCnXeg4bsR4vKCD_1C9TdW3RcZqz7Wi-sVV5R-3gtioIVInITPIDpNlBPlNC5E07nyQ2e_BJvYY_oLZn7-gWUzPf0-w7BOt6KCuU1T-KIDl9TcuGzAVeZeMrCbyVcFf4fEIkOw" -o "$outDir\1_Segurados.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRmMWNhMDc5MDYzYzRjMTQ5YmQ4YjdiNDczMWE4MmQxEgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\1_Segurados.html"

# 2. Detalhe-Segurados
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0uhXSe3Rj7rbJjm_UPEBITW-8KS8Wg_XVm0eHu_iwTNbXf81EJdMzgdn-vEX_XPdZH3XetuXebfqXSJxC3rBs9OSXQkImAejBH5HQRl6U3VoH5mg74wZo15PozbHbQ_5ywPcSfqljuQDDKXML62ozIAXaIN-Bq4JOgv3lvm4d1ZHLhe_Bfow1vIt0Q7t8RHR7UkfFPGITsMMEg74UHWzD5A7kREe_5b_9HaUP5XijJ9WwVk1o4NsHmZHbf3u" -o "$outDir\2_Detalhe-Segurados.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzI2YjE4MGUyZDMzODQ4MjI5MWI4ZmFiZDRjMzNjYzEwEgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\2_Detalhe-Segurados.html"

# 3. Kanban
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0ujW3Y0FTWkyaWwshuWwG0zcg8NHO5mTPdaD_SZY_2x0kX38FLIzQvbcDgZ34DUj58749cwlqQrLPI23h5wsIH8F4-Q2pgTDr0dMY7xK_cBEGAATAF_Ni7V_HjGHSd_4YAITOHS4N2zNRsD8yGz90VaY41uL5KSTILrmcEF9Mkk50sKjLYixMwv4n3T7W2MUZDAMdacqvUtppPYNjMfSiGCH7r8FMw_TAda86BhkZ_ot4zn_6vitsqXWWala" -o "$outDir\3_Kanban.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2EwNTBkOGYxMGY1NDQ4YWI4ZWFmMTlmZWY4OTE2ZDc1EgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\3_Kanban.html"

# 4. List-view
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0uiArUGkwsi5ZORUU2KNoGbnDSzP9m28xwMNYJJeqLGmy7Nz6-YZTpvEapvQAqmjbz4DnVhO45Uz0Ed0tHMoLchZRD0WZfXlSq9NHTCGnusd6vmbURBZTj-bHh8WReTzdAFcSkaRSG6XOsyRN-NudBbjcAl9LqcGxhAY36znHwSfjopmm08BkCrCrtCi4DwntcuhKzcHGMLvVzrG7Xyh2YDxq37rwblHuUW1lH3iXg8-3Z4ze7T9mnIB3Qgs" -o "$outDir\4_List-view.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2YzNzQ3MTE1M2E4YTQwYTRhMmYxOTgyZTNiYWYwZDIyEgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\4_List-view.html"

# 5. Anexos
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0ugEALcwm-Tco8IDTdGXwPAbXwavWoPsNkx4fELAxo768BcbJfK0sw-ZjH6Md_-m4W48BBp5zN3vGFrTAFqeeB_GApnPi7KvyoqzS66FKFisNt43LNPq_y51CTQV_HGnJI7E9esXv3WSieekDt8q1D8rmYuvJgG51NxotmtF04hTGgSoBut3X5SaQEX952Dzp42JJlCJTkGfmiLJnEDy6JTqbVu-cvmMLAQf0oi5hrc4lUjZWyX0eKXu-EI" -o "$outDir\5_Anexos.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2FhMDQzMjMxNjZhNjRhNjhhMmU2ZWZmYmUzYWYyNDMzEgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\5_Anexos.html"

# 6. Negociação
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0uj8P7fe4x9ds98WDKT6Y_IiT1RH5Pa3AVWC6Oi9I7ssfOxtV4zrW7BuyFbsacq4TXVImmlcysr2fGJn5KliwikuGAAYSbyBRPDNEmwireJoxME6RJJnOe0x5KojwLa1jMehQmRo7mbpdEgmSnNtJsGd99gLHkQtEze80fK8prCHLQoeHtxOWSQKiki95vT1fyaqfhuozOOWoXxC5AiFpGsCQ8ZOeZPWq8KzfnkrntGlSmXCxUpYzf3Dm1CN" -o "$outDir\6_Negociacao.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzllZjA1MjBjYTExNDRhODdiY2I1ODgxNWYyZGY3ZDMyEgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\6_Negociacao.html"

# 7. Produtores
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0ujHqOm0IdyQ7s-C7qM15O4ulK-Bs8N-8jBt5sf9QjV60byjgzFqxzua7DImocVgS3BizCHs5dRE-mEJ_kk268mqhojnSzgmKtcuEbfTskcJwk9ReVL4meUkoJRwizSwFKK7-ONs5AfFH3ItVLJnFZxEDDEworXTpzH2ifkZ03xMGBUFlesBlZgxAiPOVYk86aKM9Xak4K2hOJYg9HWpEKXtuEPotO95Ejc-XMO8uV-1Fmc6bIoffg4S-Ls" -o "$outDir\7_Produtores.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzM0MjZlNWU2YTlkYTQwNzNiZDYwMmNkZWZiNGI5YmMwEgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\7_Produtores.html"

# 8. Executive Analytics Dashboard V3
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0uhxtMSMJJDTzl99BRYpwtyfctpr_SZcwx_hWxVs-fq6_NT5D_vI4IBtQJVLNW5CTNZ1itTPs7CEAL_9oI5zfNRJcvdMh34moxdmmzS6KYk309aBufogk3c2gNIKAwUxDwfqcHSKXCY8Tej_v04OCfbUWx5QL6VY4P_AYTFLF6Rg75nVVsGndCvy6jzCKaqdyrx5ShGoJW8pBISItYkfked5SaDTV0bClXLm0YSu5f5cc8FaylYWJy5EHTyO" -o "$outDir\8_Executive_Analytics_Dashboard_V3.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2JjZjFjNWI4NWU2ZTRiMmE5ZmRmYzVhNTgzYTdhMDc5EgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\8_Executive_Analytics_Dashboard_V3.html"

# 9. Anexos/histórico
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0ugzP3fyFvCJAGfWG1oFDdrb5ttEcpC7LCjk9oOEkqxIg-22MCl-0xYZvdaxEvErrvcYF_OyG80rR3R3vml1oTyTYbDZdSIuWYe4NuZT19FbeJ5I8BHcaxvJzPKQxI9Ee36DblSH-Ts7dKFqb7ghoFUEsqO3WdnraVs6o8k0lgARlgugR7QMMUeCoGKCche5ghf9Elo1lkt_aLnbmFT7y1yh8S6DgySTYqItVW0lEhCmBOp-_-QBEKeJyrU" -o "$outDir\9_Anexos_historico.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzY1NTVkZWMzZDljZjQ4Mzg5Y2NhMzc3ZWM2NDYzZjQxEgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\9_Anexos_historico.html"

# 10. Sales Opportunity Kanban
curl.exe -k -L "https://lh3.googleusercontent.com/aida/ADBb0ujgSwjLdHhcT8UPSz5OCzw0j2DHMyY_kq2Nt4JurXDXzpHWU-FP4YAjv1grwF1ambtcbURiGQRgmCp_OO8vKw_OXH5_74xOpEjYa0Z9eA_LQncQpkGqzx8nGDN6kQ-0ZIvAEve2Eyvq-iKeCxFUUV0Fk5nEeVtXGHeVZExoC4y_qFBSAWptxLFmuZV15m48Am7BBsT6KMXYl7bTCCaKGx9eIbz3vwWK2B_U63CS6nzniccBNrlTvGZ3_L9I" -o "$outDir\10_Sales_Opportunity_Kanban.png"
curl.exe -k -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2NkODAyNjkxMjlhODRhMGViZjY5OGVhYzkwNjVmOWY0EgsSBxC07dnAphwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDY1ODY3MjU1NDc3Njc4NjQxNA&filename=&opi=89354086" -o "$outDir\10_Sales_Opportunity_Kanban.html"

Write-Host "Download complete"
