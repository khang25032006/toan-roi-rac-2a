class TapHopRoiRac:
    def __init__(self, so_dinh):
        self.cha = list(range(so_dinh + 1))
        
    def tim_goc(self, u):
        if self.cha[u] == u:
            return u
        self.cha[u] = self.tim_goc(self.cha[u])
        return self.cha[u]
        
    def hop_nhat(self, u, v):
        goc_u = self.tim_goc(u)
        goc_v = self.tim_goc(v)
        
        if goc_u != goc_v:
            self.cha[goc_u] = goc_v
            return True
        return False

def thuat_toan_kruskal(so_dinh, danh_sach_canh):
  
    danh_sach_canh.sort(key=lambda canh: canh[1])
    
    dsu = TapHopRoiRac(so_dinh)
    cay_khung = []
    tong_trong_so = 0
    
    for canh in danh_sach_canh:
        u, v, trong_so = canh
        
        if dsu.hop_nhat(u, v):
            cay_khung.append(canh)
            tong_trong_so += trong_so
            
            if len(cay_khung) == so_dinh - 1:
                break
                
    return tong_trong_so, cay_khung