from sqlalchemy import Column, Integer, Float
from database.config import db

class GroupCor(db.Model):
    __tablename__ = "group_cor"

    id = Column(Integer, primary_key=True)
    id_group_cor = Column(Integer, nullable=False)
    point_x = Column(Float, nullable=False)
    point_y = Column(Float, nullable=False)
    ordre = Column(Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "id_group_cor": self.id_group_cor,
            "latitude": self.point_x,
            "longitude": self.point_y,
            "ordre": self.ordre
        }
